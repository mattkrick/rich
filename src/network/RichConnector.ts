import { getMissingChanges } from '@mattkrick/automerge'
import { fromJS } from 'immutable'
import { AutomergeChanges, PseudoRange } from '../components/Editor'
import FastRTCSwarm from '@mattkrick/fast-rtc-swarm'
import FastRTCPeer, { DATA, DATA_CLOSE, DATA_OPEN } from '@mattkrick/fast-rtc-peer'
import EventEmitter from 'eventemitter3'
import RemoteRangeMap from '../ranges/RemoteRangeMap'
import RichContent from '../content/RichContent'

const CLOCK_REQUEST = 'clockRequest'
const CLOCK_RESPONSE = 'clockResponse'
export const RICH_CHANGE = 'change'

interface RichPeer extends FastRTCPeer {
  _rich: {
    docSet: { [docId: string]: Map<string, number> }
    requestSent: boolean
  }
}

interface RichChange {
  type: 'change'
  docId: string
  range?: PseudoRange
  changes?: AutomergeChanges
}

interface ClockResponse {
  type: 'clockResponse'
  clock: AutomergeClock
  docId: string
}

interface ClockRequest {
  type: 'clockRequest'
  docId: string
}

interface RichDoc {
  content: RichContent
  remoteRangeMap: RemoteRangeMap
  localRange?: PseudoRange
}

class PeerDoc {
  doc: RichDoc
  peer: RichPeer
  clock: AutomergeClock
  clockReqSent: boolean
  constructor(doc, peer, clock) {
    this.doc = doc
    this.peer = peer
    this.clock = clock
    this.clockReqSent = false
  }
}

class RichConnector extends EventEmitter {
  swarm: FastRTCSwarm
  docSet: {
    [docId: string]: RichDoc
  }
  peerDocs: Array<PeerDoc>

  constructor(swarm) {
    super()
    this.swarm = swarm
    this.docSet = {}
    this.peerDocs = []
    swarm.on(DATA, this.onData)
    swarm.on(DATA_CLOSE, this.onDataClose)
  }

  private getPeerDoc(peer, doc) {
    return this.peerDocs.find((peerDoc) => peerDoc.doc === doc && peerDoc.peer === peer)
  }

  private sendDiffAndUpdatePeer(
    docId: string,
    content: RichContent | undefined,
    range: PseudoRange | undefined,
    peer: RichPeer
  ) {
    const richChange = { type: RICH_CHANGE, docId } as RichChange
    if (range) {
      richChange.range = range
    }
    if (content) {
      const myOpSet = content.root._state.get('opSet')
      const peerClock = this.peerDocs.find((peerDoc) => peerDoc.)
      richChange.changes = getMissingChanges(myOpSet, peer._rich.docSet[docId])
      // optimistic update TODO remove this from this function
      peer._rich.docSet[docId] = (myOpSet as any).get('clock')
    }
    peer.send(JSON.stringify({ type: RICH_CHANGE, ...richChange }))
  }

  flushChangesToPeer(docId, peer) {
    const doc = this.docSet[docId]
    if (!doc) return null
    const peerDoc = this.getPeerDoc(peer, doc)
    if (!peerDoc) return null
    const {clock} = peerDoc
    const myOpSet = doc.content.root._state.get('opSet')
    const changes = getMissingChanges(myOpSet, clock)
    peerDoc.clock = myOpSet.get('clock')
  }

  addDoc(content, remoteRangeMap) {
    const { docId } = content
    this.docSet[docId] = {
      content,
      remoteRangeMap,
      localRange: undefined
    }
    this.swarm.broadcast(JSON.stringify({ type: CLOCK_REQUEST, docId }))
  }

  onData = (data: string, peer: RichPeer) => {
    const payload = JSON.parse(data) as ClockResponse | ClockRequest | RichChange
    const { type, docId } = payload
    if (type === CLOCK_REQUEST) {
      const doc = this.docSet[docId]
      // ignore docs you don't have
      if (!doc) return

      // if i have the doc, send them my clock
      peer.send(
        JSON.stringify({
          type: CLOCK_RESPONSE,
          clock: this.docSet[docId].content.root._state.getIn(['opSet', 'clock']).toJS(),
          docId
        })
      )
    } else if (type === CLOCK_RESPONSE) {
      const { clock } = payload as ClockResponse
      const doc = this.docSet[docId]
      const existingPeerDoc = this.getPeerDoc(peer, doc)
      const immutableClock = fromJS(clock)
      if (!existingPeerDoc) {
        const peerDoc = new PeerDoc(doc, peer, immutableClock)
        this.peerDocs.push(peerDoc)
      } else {
        existingPeerDoc.clock = immutableClock
      }
      sendDiffAndUpdatePeer(docId, doc.content, doc.localRange, peer)
    } else if (type === RICH_CHANGE) {
      const { docId, range, changes } = payload as RichChange
      const doc = this.docSet[docId]
      // if we don't have the doc, we don't care
      if (!doc) return
      const {content, remoteRangeMap} = doc
      remoteRangeMap.applyUpdate_(range)
      content.applyChanges_(changes)
      const immutableClock = content.root._state.getIn(['opSet', 'clock'])
      const existingPeerDoc = this.getPeerDoc(peer, doc)
      // assume peer has converged with us
      if (!existingPeerDoc) {
        const peerDoc = new PeerDoc(doc, peer, immutableClock)
        this.peerDocs.push(peerDoc)
      } else {
        existingPeerDoc.clock = immutableClock
      }
      this.emit(RICH_CHANGE, content, remoteRangeMap)
    }
  }

  onDataClose = (peer) => {
    this.removePeerFromDocs(peer)
  }

  removePeerFromDocs(peer) {
    for (let ii = this.peerDocs.length -1; ii >= 0; ii--) {
      const peerDoc = this.peerDocs[ii]
      if (peerDoc.peer !== peer) continue
      const {doc: {content, remoteRangeMap}} = peerDoc
      remoteRangeMap.removePeer_(peer.id)
      this.peerDocs.splice(ii, 1)
      this.emit(RICH_CHANGE, content, remoteRangeMap)
    }
  }

  dispatch = (content, localRange) => {
    const { docId } = content
    const doc = this.docSet[docId]
    const updatedRange = localRange !== doc.localRange ? localRange : undefined
    const updatedContent = content.isDirty ? content : undefined
    if (!updatedRange && !updatedContent) return
    doc.localRange = localRange
    const peerDocs = this.peerDocs.filter((peerDoc) => peerDoc.doc === doc)
    peerDocs.forEach((peerDoc) => {
      sendDiffAndUpdatePeer(docId, updatedContent, updatedRange, peerDoc.peer)
    })
    // const peerIds = Object.keys(this.swarm.peers)
    // peerIds.forEach(peerId => {
      // const peer = this.swarm.peers[peerId] as RichPeer
      // if (!peer._rich.docSet[docId] && !peer._rich.requestSent) {
        // peer._rich.requestSent = true
        // peer.send(JSON.stringify({ type: CLOCK_REQUEST, docId }))
      // } else {
        
      // }
    // })
  }
}

export default RichConnector
