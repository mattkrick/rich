import isRangeEqual from './isRangeEqual'
import { PseudoRange } from '../components/Editor'
import getContainerByObjectId from '../content/getContainerByObjectId'

const setSelectionRange = (pseudoRange: PseudoRange, contentRoot: Node) => {
  if (!pseudoRange) return false
  const { startId, endId, startOffset, endOffset } = pseudoRange
  // TODO cache containers by id
  const startContainer = getContainerByObjectId(startId, contentRoot)
  if (!startContainer) return false
  const endContainer =
    !endId || endId === startId ? startContainer : getContainerByObjectId(endId, contentRoot)
  if (!endContainer) return false
  const trustedRange = {
    startContainer,
    endContainer,
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
