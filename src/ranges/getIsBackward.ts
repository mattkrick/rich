const getIsBackward = (selection: Selection) => {
  const { anchorNode, anchorOffset, focusNode, focusOffset, isCollapsed } = selection
  if (isCollapsed) return false
  const position = anchorNode.compareDocumentPosition(focusNode)
  return !(position === 4 || (position === 0 && anchorOffset < focusOffset))
}

export default getIsBackward
