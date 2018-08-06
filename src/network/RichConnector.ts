import {
  AutomergeChanges,
  AutomergeClock,
  AutomergeClockObject,
  getMissingChanges
} from '@mattkrick/automerge'
import { fromJS } from 'immutable'
import { PseudoRange } from '../components/Editor'
import FastRTCSwarm from '@mattkrick/fast-rtc-swarm'
import FastRTCPeer, { DATA, DATA_CLOSE } from '@mattkrick/fast-rtc-peer'
import EventEmitter from 'eventemitter3'
import RemoteRangeMap from '../ranges/RemoteRangeMap'
import RichContent from '../content/RichContent'

const DOC_REQUEST = 'docRequest'
const DOC_RESPONSE = 'docResponse'
const PEER_REMOVAL = 'peerRemoval'
export const RICH_CHANGE = 'change'

interface RichPeer extends FastRTCPeer {
  _rich: {
    docSet: {[docId: string]: Map<string, number>}
    requestSent: boolean
  }
}

interface RichChange {
  type: 'change'
  docId: string
  range?: PseudoRange
  changes?: AutomergeChanges
}

interface DocResponse {
  type: 'docResponse'
  docId: string
  clock?: AutomergeClockObject
  changes?: AutomergeChanges
  range?: PseudoRange
}

interface DocRequest {
  type: 'docRequest'
  docId: string
  clock: AutomergeClockObject
}

class PeerDoc {
  doc: RichDoc
  peer: RichPeer
  clock: AutomergeClock
  clockReqSent: boolean

  constructor (doc: RichDoc, peer: RichPeer, clock: AutomergeClock) {
    this.doc = doc
    this.peer = peer
    this.clock = clock
    this.clockReqSent = false
  }

  updateClock (newClock: AutomergeClock) {
    this.clock = newClock
  }
}

class RichDoc {
  id: string
  localRange?: PseudoRange

  constructor (public content: RichContent, public remoteRangeMap: RemoteRangeMap) {
    this.id = content.id
  }
}

const getClock = (content: RichContent) => {
  return content.root._state.getIn(['opSet', 'clock'])
}

class RichConnector extends EventEmitter {
  docSet: {
    [docId: string]: RichDoc
  } = {}
  peerDocs: Array<PeerDoc> = []

  constructor (public swarm: FastRTCSwarm) {
    super()
    swarm.on(DATA, this.onData)
    swarm.on(DATA_CLOSE, this.onDataClose)
  }

  private getPeerDoc (peer: FastRTCPeer, doc: RichDoc) {
    return this.peerDocs.find((peerDoc) => peerDoc.doc === doc && peerDoc.peer === peer)
  }

  private ensurePeerDoc (doc: RichDoc, peer: RichPeer, defaultClock: AutomergeClock) {
    const existingPeerDoc = this.getPeerDoc(peer, doc)
    if (existingPeerDoc) return existingPeerDoc
    const peerDoc = new PeerDoc(doc, peer, defaultClock)
    this.peerDocs.push(peerDoc)
    return peerDoc
  }

  private handleDocRequest (payload: DocRequest, peer: RichPeer) {
    const { docId, clock } = payload
    const doc = this.docSet[docId]
    // ignore docs you don't have
    if (!doc) return

    const immutableClock = fromJS(clock)
    const existingPeerDoc = this.ensurePeerDoc(doc, peer, immutableClock)
    const { content, localRange } = doc
    const myOpSet = content.root._state.get('opSet')
    const myClock = myOpSet.get('clock')
    const response = { type: DOC_RESPONSE, docId, clock: myClock.toJS() } as DocResponse
    const myChanges = getMissingChanges(myOpSet, immutableClock)
    if (myChanges.size > 0) {
      response.changes = myChanges
      existingPeerDoc.updateClock(myClock)
    }
    if (localRange) {
      response.range = localRange
    }
    peer.send(JSON.stringify(response))
  }

  private handleDocResponse (payload: DocResponse, peer: RichPeer) {
    const { changes, clock, docId, range } = payload
    const doc = this.docSet[docId]
    // ignore responses that we didn't request
    if (!doc) return

    // apply changes
    const { content, remoteRangeMap, localRange } = doc
    content.applyChanges_(changes)
    remoteRangeMap.applyUpdate_(range)

    // send changes back
    const immutableClock = fromJS(clock)
    const myOpSet = content.root._state.get('opSet')
    const myChanges = getMissingChanges(myOpSet, immutableClock)
    const existingPeerDoc = this.ensurePeerDoc(doc, peer, immutableClock)
    if (myChanges.length > 0) {
      const myClock = myOpSet.get('clock')
      peer.send(
        JSON.stringify({
          type: RICH_CHANGE,
          docId,
          changes: myChanges,
          range: localRange
        })
      )
      existingPeerDoc.updateClock(myClock)
      this.emit(RICH_CHANGE, content, remoteRangeMap)
    }
  }

  private handleRichChange (payload: RichChange, peer: RichPeer) {
    const { docId, changes, range } = payload
    const doc = this.docSet[docId]
    // if we don't have the doc, we don't care
    if (!doc) return

    // apply changes
    const { content, remoteRangeMap } = doc
    content.applyChanges_(changes)
    remoteRangeMap.applyUpdate_(range)
    this.emit(RICH_CHANGE, content, remoteRangeMap)
    const peerDoc = this.getPeerDoc(peer, doc)!
    if (peerDoc) {
      peerDoc.updateClock(getClock(content))
    }
  }

  private onData = (data: string, peer: RichPeer) => {
    const payload = JSON.parse(data)
    switch (payload.type) {
      case DOC_REQUEST:
        console.log('got doc req')
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

  private onDataClose = (peer: RichPeer) => {
    this.removePeerFromDocs(peer)
  }

  removePeerFromDocs (peer: RichPeer, docId?: string) {
    for (let ii = this.peerDocs.length - 1; ii >= 0; ii--) {
      const peerDoc = this.peerDocs[ii]
      if (peerDoc.peer !== peer) continue
      if (docId !== undefined && docId !== peerDoc.doc.id) continue
      const {
        doc: { content, remoteRangeMap }
      } = peerDoc
      remoteRangeMap.removePeer_(peer.id)
      this.peerDocs.splice(ii, 1)
      this.emit(RICH_CHANGE, content, remoteRangeMap)
    }
  }

  addDoc (content: RichContent, remoteRangeMap: RemoteRangeMap) {
    const { id: docId } = content
    this.docSet[docId] = new RichDoc(content, remoteRangeMap)
    const clock = getClock(content).toJS()
    console.log('broadcast doc req')
    this.swarm.broadcast(JSON.stringify({ type: DOC_REQUEST, docId, clock }))
  }

  removeDoc (docId: string) {
    const doc = this.docSet[docId]
    if (!doc) return
    for (let ii = 0; ii < this.peerDocs.length; ii++) {
      const peerDoc = this.peerDocs[ii]
      if (peerDoc.doc !== doc) continue
      peerDoc.peer.send(
        JSON.stringify({
          type: PEER_REMOVAL,
          docId
        })
      )
    }
  }

  dispatch = (content: RichContent, localRange: PseudoRange) => {
    const { id: docId } = content
    const doc = this.docSet[docId]
    if (!doc) {
      throw new Error('You must call `addDoc` before calling dispatch')
    }
    const updatedRange = localRange !== doc.localRange ? localRange : undefined
    const updatedContent = content.isDirty ? content : undefined
    if (!updatedRange && !updatedContent) return
    doc.localRange = localRange
    const myOpSet = content.root._state.get('opSet')
    for (let ii = 0; ii < this.peerDocs.length; ii++) {
      const peerDoc = this.peerDocs[ii]
      if (peerDoc.doc !== doc) continue
      const changes = getMissingChanges(myOpSet, peerDoc.clock)
      peerDoc.peer.send(
        JSON.stringify({
          type: RICH_CHANGE,
          docId,
          changes,
          range: localRange
        })
      )
    }
  }
}

export default RichConnector
