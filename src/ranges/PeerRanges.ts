import { RichRange } from './LocalRange'

export interface PeerRange extends RichRange {
  peerId: string
  updatedAt: number
}

interface PeerRangeMap {
  [actorId: string]: PeerRange
}

class PeerRanges {
  peerRangeMap: PeerRangeMap
  dirty: boolean

  constructor (remoteRangeMap?: PeerRangeMap) {
    this.peerRangeMap = remoteRangeMap || {}
    this.dirty = true
  }

  flush () {
    const dirty = this.dirty
    this.dirty = false
    return dirty
  }

  map (mapFn: (range: PeerRange, idx: number, self: PeerRangeMap) => any): Array<any> {
    const peerIds = Object.keys(this.peerRangeMap)
    return peerIds.map((peerId, idx) => mapFn(this.peerRangeMap[peerId], idx, this.peerRangeMap))
  }

  updatePeer (peerId: string, updatedRange: RichRange | null | undefined): this {
    if (updatedRange) {
      this.dirty = true
      this.peerRangeMap[peerId] = {
        ...updatedRange,
        peerId,
        updatedAt: Date.now()
      }
    } else if (updatedRange === null) {
      this.removePeer_(peerId)
    }
    return this
  }

  removePeer_ (peerId: string): this {
    delete this.peerRangeMap[peerId]
    return this
  }
}

export default PeerRanges
