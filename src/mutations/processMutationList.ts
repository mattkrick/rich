import correctTarget from './correctTarget'
import { CharQueue, ChildListQueue } from './handleMutation'

const processMutationList = (mutationsList: Array<MutationRecord>, rootEl: HTMLDivElement) => {
  let isContentEditableOverride = false
  const rawCharQueue: CharQueue = new Set()
  const rawBuildQueue: ChildListQueue = []
  const rawDetachQueue: ChildListQueue = []
  // console.log('mutations', mutationsList)
  for (let ii = 0; ii < mutationsList.length; ii++) {
    const mutation = mutationsList[ii]
    if (!mutation.target) continue
    const { type } = mutation
    const target = mutation.target
    if (type === 'characterData') {
      rawCharQueue.add(target)
    } else if (type === 'childList' && target !== null) {
      const addedNodes = mutation.addedNodes
      for (let ii = 0; ii < addedNodes.length; ii++) {
        const node = addedNodes[ii]
        const correctedTarget = correctTarget(node, target, rootEl)
        rawBuildQueue.push({
          node,
          target: correctedTarget
        })
        if (correctedTarget !== target) {
          isContentEditableOverride = true
        }
      }
      const removedNodes = mutation.removedNodes
      for (let ii = 0; ii < removedNodes.length; ii++) {
        const node = removedNodes[ii]
        rawDetachQueue.push({
          node,
          target
        })
      }
    }
  }
  return { rawCharQueue, rawBuildQueue, rawDetachQueue, isContentEditableOverride }
}

export default processMutationList
