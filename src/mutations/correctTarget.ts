// when there is a tie, the caret is always at the end of a tag
// which means creating a new line could create it under the root, instead of the first DocNode
// if this happens, we put it where it belongs

declare global {
  // technically, this belongs on ParentNode, but the lib is all kinds of messed up
  interface Node {
    append (node: Node): void
    prepend (node: Node): void
  }
}

const correctTarget = (node: Node, target: Node, root: Element): Node => {
  if (target !== root) return target
  const isPrepend = target.firstChild === node
  const isAppend = target.lastChild === node
  // this can happen if something gets pasted to the last line. the DOM already reverted the strange mutation
  if (!isPrepend && !isAppend) return target
  target.removeChild(node)
  if (isPrepend) {
    target.firstChild!.prepend(node)
  } else {
    target.firstChild!.append(node)
  }
  return target.firstChild!
}
export default correctTarget
