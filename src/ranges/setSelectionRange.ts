import isRangeEqual from './isRangeEqual'
import { PseudoRange } from '../components/Editor'
import { RichNode } from '../components/DocNode'
import getContainerByObjectId from '../content/getContainerByObjectId'

const setSelectionRange = (pseudoRange: PseudoRange, contentRoot: RichNode) => {
  if (!pseudoRange) return false
  const { startId, endId, startOffset, endOffset } = pseudoRange
  // TODO cache containers by id
  const startContainer = getContainerByObjectId(startId, contentRoot)
  const endContainer =
    !endId || endId === startId ? startContainer : getContainerByObjectId(endId, contentRoot)
  const trustedRange = {
    startContainer: startContainer as RichNode,
    endContainer: endContainer as RichNode,
    startOffset,
    endOffset: endOffset || startOffset
  }

  const selection = window.getSelection()
  if (selection.rangeCount < 1) return false
  const windowRange = selection.getRangeAt(0) as any
  if (!isRangeEqual(trustedRange, windowRange)) {
    if (startContainer) {
      const maxLen = (startContainer.textContent && startContainer.textContent.length) || 0
      windowRange.setStart(startContainer, Math.min(maxLen, startOffset))
    } else {
      debugger
    }
    if (endContainer) {
      const maxLen = (endContainer.textContent && endContainer.textContent.length) || 0
      windowRange.setEnd(endContainer, Math.min(maxLen, trustedRange.endOffset))
    }
    return true
  }
  return false
}

export default setSelectionRange
