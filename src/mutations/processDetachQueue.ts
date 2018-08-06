import { AutomergeNode, AutomergeProxy } from '../components/Editor'
import { ChildListMutation, ChildListQueue } from './handleMutation'
import RichContent from '../content/RichContent'

const processDetachQueue = (detachQueue: ChildListQueue, content: RichContent) => {
  for (let ii = 0; ii < detachQueue.length; ii++) {
    const detachment = detachQueue[ii]
    const { node, target } = detachment as ChildListMutation
    // when collapsing 2 lines into 1 this occurs. // TODO see if we can move this to simplyQueues?
    const targetId = target._json && target._json._objectId
    if (!targetId) continue
    const removalIdx = (target._json as any).children.findIndex(
      (child: AutomergeNode) => child._objectId === node._json._objectId
    )
    if (removalIdx !== -1) {
      content.change_('remove node', (proxyDoc: AutomergeProxy) => {
        const targetDoc = proxyDoc._get(targetId)
        targetDoc.children.deleteAt(removalIdx)
      })
      target._json = content.root._state.getIn(['opSet', 'cache', targetId])
    }
  }
}

export default processDetachQueue
