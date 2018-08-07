/*
 * Uses a dfs because textNodes can't hold id attributes
 * and climbing up the JSON tree gets very messy
 */
import { AutomergeNode } from '../components/Editor'

const getContainerByObjectId = (objectId: string, contentRoot: Node): Node | null => {
  if (
    contentRoot &&
    contentRoot._json &&
    (contentRoot._json as AutomergeNode)._objectId === objectId
  ) {
    // this is how content editable keeps a caret in a br (hit backspace so there are no more chars on line, but don't remove line)
    return contentRoot
  }

  const treeWalker = document.createTreeWalker(contentRoot)
  while (true) {
    const nextNode = treeWalker.nextNode()
    if (nextNode && !nextNode._json) {
      debugger
    }
    if (!nextNode || (nextNode._json as AutomergeNode)._objectId === objectId) {
      return nextNode
    }
  }
}

export default getContainerByObjectId
