import voidElements from '../content/voidElements'
import { QueuedRichNode, RichNode } from '../components/DocNode'
import { AutomergeElement, TemporaryTextNode } from '../components/Editor'
import { ChildListMutation, ChildListQueue } from './handleMutation'

export type AttachQueue = Map<RichNode, Set<RichNode> | undefined>

const createLeaf = (node: RichNode) => {
  if (node.nodeType === Node.TEXT_NODE) {
    ;(node as QueuedRichNode)._json = {
      type: 'text',
      content: node.textContent || ''
    }
  } else {
    const tagName = (node as any).tagName.toLowerCase() as string
    ;(node as QueuedRichNode)._json = {
      type: 'element',
      tagName,
      attributes: []
    }
    if (!voidElements.has(tagName)) {
      ;(node as any)._json.children = []
    }
  }
}

const completeNode = (node: RichNode, target: RichNode, attachQueue: AttachQueue) => {
  for (let ii = 0; ii < node.childNodes.length; ii++) {
    const child = (node.childNodes[ii] as any) as RichNode
    if (child._json) continue
    completeNode(child, node, attachQueue)
  }

  // now that all the children are accounted for, see if the node needs to be attached
  if (!node._json) {
    // if the node has no json, it definitely needs ot be attached
    createLeaf(node)
  } else if (
    target._json.type === 'element' &&
    target._json.children &&
    target._json.children.find(
      child => child._objectId === (node._json as AutomergeElement)._objectId
    )
  ) {
    // if it has json, see if the target already owns it. if so, no attachment necessary
    return
  }
  const targetQueue = attachQueue.get(target)
  if (!targetQueue) {
    attachQueue.set(target, new Set([node]))
  } else {
    targetQueue.add(node)
  }
}

// there are no guarantees that every node will be accounted for in the mutation events
// some nodes include their children (and maybe grandchildren) so we
const processBuildQueue = (buildQueue: ChildListQueue) => {
  const attachQueue = new Map()
  for (let ii = 0; ii < buildQueue.length; ii++) {
    const nodeToBuild = buildQueue[ii] as ChildListMutation
    const { node, target } = nodeToBuild
    completeNode(node, target, attachQueue)
  }
  return attachQueue
}

export default processBuildQueue
