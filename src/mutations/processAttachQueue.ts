import Automerge from '@mattkrick/automerge'
import { AutomergeElement, AutomergeTextNode, TemporaryTextNode } from '../components/Editor'
import { AttachQueue } from './processBuildQueue'
import { RichNode } from '../components/DocNode'
import RichContent from '../content/RichContent'

const processAttachQueue = (attachQueue: AttachQueue, content: RichContent) => {
  if (!attachQueue.size) return
  const attachNodes = (nodeSet: Set<RichNode> | undefined, target: RichNode) => {
    if (!nodeSet) return
    // if the target doesn't exist yet, it's a child something that hasn't been added yet
    const targetId = (target._json && (target._json as AutomergeElement | AutomergeTextNode))
      ._objectId
    if (!targetId) return
    for (let ii = 0; ii < target.childNodes.length; ii++) {
      const node = target.childNodes[ii] as any
      if (!nodeSet.has(node)) continue // always noop? probably in delete queue
      content.change_((proxyDoc: any) => {
        const targetDoc = proxyDoc._get(targetId)
        targetDoc.children.insertAt(ii, node._json)
        const textNode = targetDoc.children[ii]
        const { content } = node._json as AutomergeTextNode | TemporaryTextNode
        if (typeof content === 'string') {
          textNode.content = new Automerge.Text()
          textNode.content.insertAt(0, ...content.split(''))
        }
      })
      target._json = content.root._state.getIn(['opSet', 'cache', targetId])
      node._json = (target._json as any).children[ii]
      const childNodeSet = attachQueue.get(node)
      attachNodes(childNodeSet, node)
    }
    attachQueue.set(target, undefined)
  }
  attachQueue.forEach(attachNodes)
}

export default processAttachQueue
