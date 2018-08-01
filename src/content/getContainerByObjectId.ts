import { RichNode } from '../components/DocNode'
/*
 * Uses a dfs because textNodes can't hold id attributes
 * and climbing up the JSON tree gets very messy
 */
const getContainerByObjectId = (
  objectId: string,
  contentRoot: RichNode
): RichNode | Text | null => {
  if (contentRoot._json._objectId === objectId) {
    // this is how content editable keeps a caret in a br (hit backspace so there are no more chars on line, but don't remove line)
    return contentRoot
  }

  const treeWalker = document.createTreeWalker(contentRoot)
  while (true) {
    const nextNode = treeWalker.nextNode() as RichNode | null
    if (nextNode && !nextNode._json) {
      debugger
    }
    if (!nextNode || nextNode._json._objectId === objectId) {
      return nextNode
    }
  }
}

export default getContainerByObjectId
