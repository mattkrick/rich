import processBuildQueue from './processBuildQueue'
import processAttachQueue from './processAttachQueue'
import processDetachQueue from './processDetachQueue'
import observerConfig from './observerConfig'
import handleCharacterData from './handleCharacterData'
import simplifyQueues from './simplifyQueues'
import Editor from '../components/Editor'
import processMutationList from './processMutationList'

export interface ChildListMutation {
  node: Node
  target: Node
}

export type ChildListQueue = Array<ChildListMutation | undefined>
export type CharQueue = Set<Node>

const handleMutation = (self: Editor) => (mutationsList: Array<MutationRecord>) => {
  const { onChange, doc } = self.props
  const { content, localRange } = doc
  localRange.cacheRange()
  const rootEl = self.rootRef.current as HTMLDivElement
  const observer = self.observer as MutationObserver

  observer.disconnect() // ignore any DOM changes while we correct & calculate mutations
  const { rawCharQueue, rawBuildQueue, rawDetachQueue } = processMutationList(mutationsList)

  // if the same node is added & removed to/from the same target, cancel them both out
  const charQueue = Array.from(rawCharQueue)
  const { buildQueue, detachQueue } = simplifyQueues(rawBuildQueue, rawDetachQueue)

  // turn nodes into JSON
  const attachQueue = processBuildQueue(buildQueue)

  // link nodes together
  processAttachQueue(attachQueue, content)

  // remove nodes
  processDetachQueue(detachQueue, content)

  const isContentUpdate = content.isDirty

  // update some nodes (do this last to avoid updating something that's being removed)
  handleCharacterData(charQueue, content)

  /*
   * this is the magic. now that we've cloned the state into a CRDT json, we can undo it
   * & recreate the state from JSON through react.
   * this is necessary so react can update its vdom
   * in the future, maybe we can do away with react, but then plugins may suffer. TBD
  */
  if (isContentUpdate) {
    document.execCommand('undo')
  }

  const isRangeUpdate = localRange.fromCache()
  observer.observe(rootEl, observerConfig) // side-effects complete! resume listening for user events
  if (isContentUpdate || isRangeUpdate) {
    onChange(doc, isContentUpdate)
  }
}

export default handleMutation
