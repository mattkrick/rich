import processBuildQueue from './processBuildQueue'
import processAttachQueue from './processAttachQueue'
import processDetachQueue from './processDetachQueue'
import observerConfig from './observerConfig'
import handleCharacterData from './handleCharacterData'
import simplifyQueues from './simplifyQueues'
import Editor from '../components/Editor'
import getNextPseudoRange from '../ranges/getNextPseudoRange'
import getIsBackward from '../ranges/getIsBackward'
import processMutationList from './processMutationList'

export interface WindowRange {
  startContainer: Node
  endContainer: Node
  startOffset: number
  endOffset: number
}

export interface ChildListMutation {
  node: Node
  target: Node
}

export type ChildListQueue = Array<ChildListMutation | undefined>
export type CharQueue = Set<Node>

const handleMutation = (self: Editor) => (mutationsList: Array<MutationRecord>) => {
  const rootEl = self.rootRef.current as HTMLDivElement
  const observer = self.observer as MutationObserver
  const selection = window.getSelection()
  const { startContainer, endContainer, startOffset, endOffset } = selection.getRangeAt(0)
  const isBackward = getIsBackward(selection)
  const windowRange = {
    startContainer: startContainer,
    endContainer: endContainer,
    startOffset,
    endOffset
  }

  observer.disconnect() // ignore any DOM changes while we correct & calculate mutations
  const { onChange, content } = self.props
  const {
    rawCharQueue,
    rawBuildQueue,
    rawDetachQueue,
    isContentEditableOverride
  } = processMutationList(mutationsList, rootEl)

  // if the same node is added & removed to/from the same target, cancel them both out
  const charQueue = Array.from(rawCharQueue)
  const { buildQueue, detachQueue } = simplifyQueues(rawBuildQueue, rawDetachQueue)

  // turn nodes into JSON
  const attachQueue = processBuildQueue(buildQueue)

  // link nodes together
  processAttachQueue(attachQueue, content)

  // remove nodes
  processDetachQueue(detachQueue, content)

  // don't call isChanged because we'll want to pass an honest value to onChange
  const isNodeAddedOrRemoved = content.isDirty

  // update some nodes (do this last to avoid updating something that's being removed)
  handleCharacterData(charQueue, content)

  const nextRange = getNextPseudoRange(
    self.localRange,
    windowRange,
    content.root._actorId,
    isBackward
  )

  // TODO see if we can refactor this
  if (nextRange !== self.localRange) {
    self.localRange = nextRange
  }

  /*
   * this is the magic. now that we've cloned the state into a CRDT json, we can undo it
   * & recreate the state from JSON through react.
   * this is necessary so react can update its vdom
   * in the future, maybe we can do away with react, but then plugins may suffer. TBD
  */
  if (isContentEditableOverride || isNodeAddedOrRemoved) {
    document.execCommand('undo')
  }

  observer.observe(rootEl, observerConfig) // side-effects complete! resume listening for user events
  onChange(content, nextRange)
}

export default handleMutation
