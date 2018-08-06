import { PseudoRange } from '../components/Editor'

interface RemoveRange {
  actorId: string
  startId?: string
}

interface RemoteRangeMapStore {
  [actorId: string]: PseudoRange
}

class RemoteRangeMap {
  store: RemoteRangeMapStore
  dirty: boolean
  constructor (store?: RemoteRangeMapStore) {
    this.store = store || {}
    this.dirty = true
  }

  isChanged () {
    const dirty = this.dirty
    this.dirty = false
    return dirty
  }

  map (mapFn: (range: PseudoRange, actorId: string, self: this) => any): Array<any> {
    const actorIds = Object.keys(this.store)
    return actorIds.map((actorId) => mapFn(this.store[actorId], actorId, this))
  }

  applyUpdate_ (updatedRange?: PseudoRange | RemoveRange): this {
    if (updatedRange) {
      this.dirty = true
      const { actorId, startId } = updatedRange
      if (!startId) {
        // is removal
        delete this.store[actorId]
      } else {
        this.store[actorId] = updatedRange as PseudoRange
      }
    }
    return this
  }
  removePeer_ (peerId: string): this {
    delete this.store[peerId]
    return this
  }
}

export default RemoteRangeMap
