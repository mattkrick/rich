import { fromJS } from 'immutable'
import FastRTCSwarm from '@mattkrick/fast-rtc-swarm'
import FastRTCPeer, { DATA, DATA_CLOSE, DATA_OPEN } from '@mattkrick/fast-rtc-peer'
import EventEmitter from 'eventemitter3'
import RichContent from '../content/RichContent'
import { AutomergeChanges, AutomergeClock, AutomergeClockObject, getMissingChanges } from 'automerge'
import RichDoc from '../RichDoc'
import { RichRange } from '../ranges/LocalRange'

const DOC_REQUEST = 'docRequest'
const DOC_RESPONSE = 'docResponse'
const PEER_REMOVAL = 'peerRemoval'
export const RICH_CHANGE = 'change'

interface RichChange {
  type: 'change'
  docId: string
  range?: RichRange | null
  changes?: AutomergeChanges
}

interface DocResponse {
  type: 'docResponse'
  docId: string
  // always send the clock so the peer knows where were when you received the req, even if you don't send changes
  clock: AutomergeClockObject
  changes?: AutomergeChanges
  range?: RichRange
}

interface DocRequest {
  type: 'docRequest'
  docId: string
  clock: AutomergeClockObject
}

interface DocSet {
  [docId: string]: RichDoc
}

class PeerClock {
  constructor (public doc: RichDoc, public peer: FastRTCPeer, public clock: AutomergeClock) {}
  updateClock (newClock: AutomergeClock) {
    this.clock = newClock
  }
}

const getClock = (content: RichContent) => {
  return content.root._state.getIn(['opSet', 'clock'])
}

class RichConnector extends EventEmitter {
  docSet: DocSet = {}
  peerClocks: Array<PeerClock> = []
  swarm?: FastRTCSwarm

  private getPeerClock (peer: FastRTCPeer, doc: RichDoc) {
    return this.peerClocks.find((peerClock) => peerClock.doc === doc && peerClock.peer === peer)
  }

  private ensurePeerClock (doc: RichDoc, peer: FastRTCPeer, defaultClock: AutomergeClock) {
    const existingPeerClock = this.getPeerClock(peer, doc)
    if (existingPeerClock) return existingPeerClock
    const peerClock = new PeerClock(doc, peer, defaultClock)
    this.peerClocks.push(peerClock)
    return peerClock
  }

  private handleDocRequest (payload: DocRequest, peer: FastRTCPeer) {
    const { docId, clock } = payload
    const doc = this.docSet[docId]
    if (!doc) return

    const immutableClock = fromJS(clock)
    const existingPeerClock = this.ensurePeerClock(doc, peer, immutableClock)
    const { content, localRange } = doc
    const myOpSet = content.root._state.get('opSet')
    const myClock = myOpSet.get('clock')
    const response = { type: DOC_RESPONSE, docId, clock: myClock.toJS() } as DocResponse
    const myChanges = getMissingChanges(myOpSet, immutableClock)
    if (myChanges.size > 0) {
      response.changes = myChanges
      existingPeerClock.updateClock(myClock)
    }
    if (localRange.root) {
      response.range = localRange.root
    }
    peer.send(JSON.stringify(response))
  }

  private applyRichChange (
    doc: RichDoc,
    changes: AutomergeChanges | undefined,
    range: RichRange | undefined | null,
    peerId: string
  ) {
    const { content, peerRanges } = doc
    content.applyChanges_(changes)
    peerRanges.updatePeer(peerId, range)
    if (changes || range !== undefined) {
      this.emit(RICH_CHANGE, doc)
    }
  }

  private handleDocResponse (payload: DocResponse, peer: FastRTCPeer) {
    const { changes, clock, docId, range } = payload
    const doc = this.docSet[docId]
    if (!doc) return

    // apply changes
    this.applyRichChange(doc, changes, range, peer.id)

    // ensure peer
    const { content, localRange } = doc
    const immutableClock = fromJS(clock)
    const existingPeerClock = this.ensurePeerClock(doc, peer, immutableClock)

    // get changes
    const myOpSet = content.root._state.get('opSet')
    const myChanges = getMissingChanges(myOpSet, immutableClock)
    if (myChanges.size > 0) {
      // send changes
      const myClock = myOpSet.get('clock')
      peer.send(
        JSON.stringify({
          type: RICH_CHANGE,
          docId,
          changes: myChanges,
          range: localRange
        })
      )
      existingPeerClock.updateClock(myClock)
    }
  }

  private handleRichChange (payload: RichChange, peer: FastRTCPeer) {
    const { docId, changes, range } = payload
    const doc = this.docSet[docId]
    if (!doc) return

    // apply changes
    this.applyRichChange(doc, changes, range, peer.id)

    // update clock
    const { content } = doc
    const peerClock = this.getPeerClock(peer, doc)
    if (peerClock) {
      peerClock.updateClock(getClock(content))
    }
  }

  private onData = (data: string, peer: FastRTCPeer) => {
    const payload = JSON.parse(data)
    switch (payload.type) {
      case DOC_REQUEST:
        this.handleDocRequest(payload, peer)
        break
      case DOC_RESPONSE:
        this.handleDocResponse(payload, peer)
        break
      case RICH_CHANGE:
        this.handleRichChange(payload, peer)
        break
      case PEER_REMOVAL:
        this.removePeerFromDocs(peer, payload.docId)
    }
  }

  private onDataClose = (peer: FastRTCPeer) => {
    this.removePeerFromDocs(peer)
  }

  private onDataOpen = (peer: FastRTCPeer) => {
    const docIds = Object.keys(this.docSet)
    docIds.forEach((docId) => {
      peer.send(this.makeDocRequest(docId))
    })
  }

  private makeDocRequest (docId: string) {
    const clock = getClock(this.docSet[docId].content).toJS()
    return JSON.stringify({ type: DOC_REQUEST, docId, clock })
  }

  removePeerFromDocs (peer: FastRTCPeer, docId?: string) {
    for (let ii = this.peerClocks.length - 1; ii >= 0; ii--) {
      const peerClock = this.peerClocks[ii]
      if (peerClock.peer !== peer) continue
      if (docId !== undefined && docId !== peerClock.doc.id) continue
      const { doc } = peerClock
      doc.peerRanges.removePeer_(peer.id)
      this.peerClocks.splice(ii, 1)
      this.emit(RICH_CHANGE, doc)
    }
  }

  addSwarm (swarm: FastRTCSwarm) {
    this.swarm = swarm
    swarm.on(DATA_OPEN, this.onDataOpen)
    swarm.on(DATA, this.onData)
    swarm.on(DATA_CLOSE, this.onDataClose)
    const docIds = Object.keys(this.docSet)
    docIds.forEach((docId) => {
      swarm.broadcast(this.makeDocRequest(docId))
    })
  }

  addDoc (doc: RichDoc) {
    const { id: docId } = doc
    this.docSet[docId] = doc
    if (this.swarm) {
      this.swarm.broadcast(this.makeDocRequest(docId))
    }
  }

  removeDoc (docId: string) {
    const doc = this.docSet[docId]
    if (!doc) return
    for (let ii = 0; ii < this.peerClocks.length; ii++) {
      const peerClock = this.peerClocks[ii]
      if (peerClock.doc !== doc) continue
      peerClock.peer.send(
        JSON.stringify({
          type: PEER_REMOVAL,
          docId
        })
      )
    }
  }

  dispatch = (docId: string) => {
    const doc = this.docSet[docId]
    const { localRange, content } = doc
    if (!doc) {
      throw new Error('You must call `addDoc` before calling dispatch')
    }
    if (!localRange.isDirty && !content.isDirty) return
    for (let ii = 0; ii < this.peerClocks.length; ii++) {
      const peerClock = this.peerClocks[ii]
      if (peerClock.doc !== doc) continue
      const payload = { docId, type: RICH_CHANGE } as RichChange
      if (localRange.isDirty) {
        payload.range = localRange.flush()
      }
      if (content.isDirty) {
        payload.changes = content.flushChanges(peerClock.clock)
      }
      peerClock.peer.send(JSON.stringify(payload))
    }
  }
}

export default RichConnector
