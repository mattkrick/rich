import correctTarget from './correctTarget'
import { RichNode } from '../components/DocNode'
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
    const target = mutation.target as RichNode
    if (type === 'characterData') {
      rawCharQueue.add(target)
    } else if (type === 'childList' && target !== null) {
      const addedNodes = mutation.addedNodes as any
      addedNodes.forEach((node: RichNode) => {
        const correctedTarget = correctTarget(node, target, rootEl as any) as RichNode
        rawBuildQueue.push({
          node,
          target: correctedTarget
        })
        if (correctedTarget !== target) {
          isContentEditableOverride = true
        }
      })
      const removedNodes = mutation.removedNodes as any
      removedNodes.forEach((node: RichNode) => {
        rawDetachQueue.push({
          node,
          target
        })
      })
    }
  }
  return { rawCharQueue, rawBuildQueue, rawDetachQueue, isContentEditableOverride }
}

export default processMutationList
