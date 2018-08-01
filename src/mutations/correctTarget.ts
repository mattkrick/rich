// when there is a tie, the caret is always at the end of a tag
// which means creating a new line could create it under the root, instead of the first DocNode
// if this happens, we put it where it belongs
import { RichNode } from '../components/DocNode'

const correctTarget = (node: RichNode, target: RichNode, root: RichNode) => {
  if (target !== root) return target
  const isPrepend = target.firstChild === node
  const isAppend = target.lastChild === node
  // this can happen if something gets pasted to the last line. the DOM already reverted the strange mutation
  if (!isPrepend && !isAppend) return target
  target.removeChild(node)
  if (isPrepend) {
    ;(target.firstChild as any).prepend(node)
  } else {
    ;(target.firstChild as any).append(node)
  }
  return target.firstChild
}
export default correctTarget
