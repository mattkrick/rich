import { RichNode } from '../components/DocNode'
import getContainerByObjectId from '../content/getContainerByObjectId'
import { PseudoRange } from '../components/Editor'
import { BoundingBox } from '../components/RemoteSelectionRange'

const getStartContainerBBox = (
  startContainer: RichNode,
  startOffset: number,
  endContainer: RichNode,
  endOffset: number
): BoundingBox => {
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const topParentNode = startContainer.parentNode as Element
    const topTmpSpan = document.createElement('span')
    const fullText = startContainer.textContent as string
    const endIdx = startContainer === endContainer ? endOffset : undefined
    topTmpSpan.textContent = fullText.slice(startOffset, endIdx)
    startContainer.textContent = fullText.slice(0, startOffset)
    topParentNode.insertBefore(topTmpSpan, startContainer.nextSibling)
    const { left, top, height, width } = topTmpSpan.getBoundingClientRect()
    startContainer.textContent = fullText
    topParentNode.removeChild(topTmpSpan)
    return { left, top, height, width }
  }
  const { left, top, height, width } = (startContainer as any).getBoundingClientRect()
  return { left, top, height, width }
}

const getFullLineBBox = (node: Node): BoundingBox => {
  const boundingArea = document.createRange()
  boundingArea.selectNodeContents(node)
  const { top, left, height, width } = (boundingArea as Element | Range).getBoundingClientRect()
  return { top, left, height, width }
}

const getEndContainerBBox = (endContainer: any, endOffset: number): BoundingBox | null => {
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const parentNode = endContainer.parentNode as Element
    const tmpSpan = document.createElement('span')
    tmpSpan.textContent = (endContainer.textContent as string).slice(0, endOffset)
    parentNode.insertBefore(tmpSpan, endContainer)
    const { left, top, height, width } = tmpSpan.getBoundingClientRect()
    parentNode.removeChild(tmpSpan)
    return { left, top, height, width }
  }
  let smallestEndContainer = endContainer
  while (smallestEndContainer.firstChild) {
    smallestEndContainer = smallestEndContainer.firstChild
  }

  // necessary for triple clicks since the caret is reported as the beginning of next line
  if (smallestEndContainer.nodeType === Node.TEXT_NODE) {
    // TODO triple clicking in the playground still yields not perfect results
    return null
  }

  // necessary for <br> IIRC
  const { left, top, height, width } = (smallestEndContainer as any).getBoundingClientRect()
  return { left, top, height, width }
}

const getCollapsedCaret = (endContainer: RichNode, endOffset: number) => {
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const { top, left, height, width } = getEndContainerBBox(endContainer, endOffset) as BoundingBox
    return {
      top,
      left: left + width,
      height
    }
  }
  const { left, top, height } = (endContainer as any).getBoundingClientRect()
  return { left, top, height }
}

const getNestedMiddleBBoxes = (childNodes, endNode, selectionBoxes) => {
  for (let ii = 0; ii < childNodes.length; ii++) {
    const node = childNodes[ii]
    if (node === endNode) return
    if (node.contains(endNode)) {
      getNestedMiddleBBoxes(node.childNodes, endNode, selectionBoxes)
      return
    } else {
      const nextSelectionBox = getFullLineBBox(node)
      const prevSelectionBox = selectionBoxes[selectionBoxes.length - 1]
      if (nextSelectionBox.top === prevSelectionBox.top) {
        prevSelectionBox.width += nextSelectionBox.width
        // pick max height of the 2?
      } else {
        selectionBoxes.push(nextSelectionBox)
      }
    }
  }
}
const getMiddleBBoxes = (
  startContainer: RichNode,
  endContainer: RichNode,
  selectionBoxes: Array<BoundingBox>
) => {
  let parentOfBoth = endContainer.parentNode
  while (parentOfBoth && !parentOfBoth.contains(startContainer)) {
    parentOfBoth = parentOfBoth.parentNode
  }
  const { childNodes } = parentOfBoth as RichNode
  let startContainerFound = false
  for (let ii = 0; ii < childNodes.length; ii++) {
    const node = childNodes[ii]
    if (!startContainerFound) {
      if (node.contains(startContainer)) {
        // const children = node.childNodes
        startContainerFound = true
      }
      continue
    }
    if (node.contains(endContainer)) {
      getNestedMiddleBBoxes(node.childNodes, endContainer, selectionBoxes)
      break
    } else {
      selectionBoxes.push(getFullLineBBox(node))
    }
  }
}

const getRemoteRangeBBox = (pseudoRange: PseudoRange, contentRoot: RichNode) => {
  const { startId, endId, endOffset, startOffset, isBackward } = pseudoRange
  const startContainer = getContainerByObjectId(startId, contentRoot) as RichNode
  const endContainer =
    !endId || endId === startId
      ? startContainer
      : (getContainerByObjectId(endId, contentRoot) as RichNode)
  const isCollapsed = !endId || (endId === startId && endOffset === startOffset)
  if (isCollapsed) {
    return {
      selectionBoxes: [],
      caretCoords: getCollapsedCaret(endContainer, endOffset as number)
    }
  } else {
    const selectionBoxes: Array<BoundingBox> = []
    const topBBox = getStartContainerBBox(
      startContainer,
      startOffset,
      endContainer,
      endOffset as number
    )
    selectionBoxes.push(topBBox)
    if (startContainer !== endContainer) {
      getMiddleBBoxes(startContainer, endContainer, selectionBoxes)
      const endContainerBBox = getEndContainerBBox(endContainer, endOffset as number)
      if (endContainerBBox) {
        selectionBoxes.push(endContainerBBox)
      }
    }
    const referenceBBox = isBackward ? topBBox : selectionBoxes[selectionBoxes.length - 1]
    const caretCoords = {
      top: referenceBBox.top,
      left: isBackward ? referenceBBox.left : referenceBBox.left + referenceBBox.width,
      height: referenceBBox.height
    }
    return { selectionBoxes, caretCoords }
  }
}

export default getRemoteRangeBBox
