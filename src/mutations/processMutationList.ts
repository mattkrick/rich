import { CharQueue, ChildListQueue } from './handleMutation'

const processMutationList = (mutationsList: Array<MutationRecord>) => {
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
        rawBuildQueue.push({
          node,
          target
        })
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
  return { rawCharQueue, rawBuildQueue, rawDetachQueue }
}

export default processMutationList
