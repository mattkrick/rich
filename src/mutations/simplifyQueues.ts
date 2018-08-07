// if we're told to build something in the same breath we're told to destroy it, don't both building it

import { ChildListMutation, ChildListQueue } from './handleMutation'

const simplifyQueues = (buildQueue: ChildListQueue, detachQueue: ChildListQueue) => {
  if (!buildQueue.length) return { buildQueue, detachQueue }
  let isMatch = false
  const removedNodes: Array<Node> = []
  for (let ii = buildQueue.length - 1; ii >= 0; ii--) {
    const buildingBlock = buildQueue[ii] as ChildListMutation
    for (let jj = detachQueue.length - 1; jj >= 0; jj--) {
      const detachment = detachQueue[jj]
      if (
        detachment &&
        buildingBlock.node === detachment.node &&
        buildingBlock.target === detachment.target
      ) {
        isMatch = true
        detachQueue[jj] = undefined
        buildQueue[ii] = undefined
        removedNodes.push(detachment.node)
        break
      }
    }
  }
  if (!isMatch) return { buildQueue, detachQueue }

  // Sometimes, mutations aren't even triggered for child nodes that get added & deleted (like paste + undo)
  for (let ii = 0; ii < buildQueue.length; ii++) {
    const buildingBlock = buildQueue[ii]
    if (!buildingBlock) continue
    for (let jj = 0; jj < removedNodes.length; jj++) {
      const removedNode = removedNodes[jj]
      if (buildingBlock.target === removedNode) {
        buildQueue[ii] = undefined
        break
      }
    }
  }

  return { buildQueue: buildQueue.filter(Boolean), detachQueue: detachQueue.filter(Boolean) }
}

export default simplifyQueues
