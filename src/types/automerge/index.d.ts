declare module 'automerge' {
  import { List, Map } from 'immutable'
  interface MappedObject<U> extends Map<string, any> {
    toJS (): U
    get<K extends keyof U> (key: K & string): U[K]
  }
  interface AutomergeClockObject {
    [actorId: string]: number
  }
  type AutomergeClock = MappedObject<AutomergeClockObject>
  interface AutomergeOpSetObject {
    states: Map<string, any>
    history: List<any>
    byObject: Map<string, any>
    clock: AutomergeClock
    deps: Map<string, any>
    local: List<any>
    queue: List<any>
  }

  type AutomergeOpSet = MappedObject<AutomergeOpSetObject>

  interface AutomergeStateObject {
    actorId: string
    opSet: AutomergeOpSet
  }

  type AutomergeStateMap = MappedObject<AutomergeStateObject>
  type AutomergeChanges = List<object>

  interface AutomergeObject {
    _state: AutomergeStateMap
    _actorId: string
    _objectId: string
    [key: string]: any
  }

  export interface AutomergeRoot extends AutomergeObject {
    // TODO export objectId from OpSet
    _objectId: '00000000-0000-0000-0000-000000000000'
  }

  export interface AutomergeProxy {
    insertAt (index: number, ...itemsToAdd: Array<any>): AutomergeProxy
    deleteAt (index: number, numberToDelete: number): AutomergeProxy
    [key: string]: any
  }

  type AutomergeUpdater = (proxyDoc: AutomergeProxy) => void
  class Text {
    _objectId: string
    join (delim: string): string
    insertAt (index: number, ...itemsToAdd: Array<any>): AutomergeProxy
    deleteAt (index: number, numberToDelete?: number | Array<number>): AutomergeProxy
  }
  function applyChanges (root: AutomergeRoot, changes: AutomergeChanges): AutomergeRoot
  function change (
    root: AutomergeRoot,
    message?: string | AutomergeUpdater,
    updater?: AutomergeUpdater | undefined
  ): AutomergeRoot
  function getMissingChanges (opSet: AutomergeOpSet, clock: AutomergeClock): AutomergeChanges
  function init (actorId?: string): AutomergeRoot
  function load (raw: string): AutomergeRoot
}
