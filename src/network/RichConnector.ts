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

interface AutomergeClock {
  [actorId: string]: number
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

const sendDiffAndUpdatePeer = (
  docId: string,
  content: RichContent | undefined,
  range: PseudoRange | undefined,
  peer: RichPeer
) => {
  const richChange = { type: RICH_CHANGE, docId } as RichChange
  if (range) {
    richChange.range = range
  }
  if (content) {
    const myOpSet = content.doc._state.get('opSet')
    richChange.changes = getMissingChanges(myOpSet, peer._rich.docSet[docId])
    // optimistic update
    peer._rich.docSet[docId] = (myOpSet as any).get('clock')
  }
  peer.send(JSON.stringify({ type: RICH_CHANGE, ...richChange }))
}

interface RichDoc {
  content: RichContent
  remoteRangeMap: RemoteRangeMap
  localRange?: PseudoRange
}

interface PeerDoc {
  doc: RichDoc
  peer: RichPeer
  clock: AutomergeClock
  clockReqSent: boolean
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
    // this.content = content
    // this.remoteRangeMap = remoteRangeMap
    swarm.on(DATA_OPEN, this.onDataOpen)
    swarm.on(DATA, this.onData)
    swarm.on(DATA_CLOSE, this.onDataClose)
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

      // const
      peer.send(
        JSON.stringify({
          type: CLOCK_RESPONSE,
          clock: this.docSet[docId].content.doc._state.getIn(['opSet', 'clock']).toJS(),
          docId
        })
      )
    } else if (type === CLOCK_RESPONSE) {
      const { clock } = payload as ClockResponse
      peer._rich.docSet[docId] = fromJS(clock)
      sendDiffAndUpdatePeer(docId, this.content, this.localRange, peer)
    } else if (type === RICH_CHANGE) {
      const { docId, range, changes } = payload as RichChange
      this.remoteRangeMap.applyUpdate_(range)
      this.content.applyChanges_(changes)
      // assume peer has converged with us
      peer._rich.docSet[docId] = this.content.doc._state.getIn(['opSet', 'clock'])
      this.emit(RICH_CHANGE, this.content, this.remoteRangeMap)
    }
  }

  // onDataOpen = (peer) => {
  //   peer._rich = {
  //     docSet: {},
  //     requestSet: new Set()
  //   }
  // }

  onDataClose = peer => {
    this.remoteRangeMap.applyUpdate_({ actorId: peer.id })
    this.emit(RICH_CHANGE, this.content, this.remoteRangeMap)
  }

  dispatch = (nextLocalRange, nextContent, isContentChanged) => {
    const updatedRange = nextLocalRange !== this.localRange ? nextLocalRange : undefined
    const updatedContent = isContentChanged ? nextContent : undefined
    if (!updatedRange && !updatedContent) return
    this.localRange = nextLocalRange
    const { docId } = nextContent
    const peerIds = Object.keys(this.swarm.peers)
    peerIds.forEach(peerId => {
      const peer = this.swarm.peers[peerId] as RichPeer
      if (!peer._rich.docSet[docId] && !peer._rich.requestSent) {
        peer._rich.requestSent = true
        peer.send(JSON.stringify({ type: CLOCK_REQUEST, docId }))
      } else {
        sendDiffAndUpdatePeer(docId, updatedContent, updatedRange, peer)
      }
    })
  }
}

export default RichConnector
