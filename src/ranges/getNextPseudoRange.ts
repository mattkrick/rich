import { RichNode } from '../components/DocNode'
import { PseudoRange } from '../components/Editor'
import { WindowRange } from '../mutations/handleMutation'

const getNextPseudoRange = (
  pseudoRange: PseudoRange | undefined,
  windowRange: WindowRange | Range,
  actorId: string,
  isBackward: boolean
) => {
  const { startOffset, startContainer, endOffset, endContainer } = windowRange
  const windowStartId = (startContainer as RichNode)._json._objectId
  const windowEndId = (endContainer as RichNode)._json._objectId
  if (
    pseudoRange &&
    pseudoRange.startOffset === startOffset &&
    pseudoRange.endOffset === endOffset &&
    pseudoRange.startId === windowStartId &&
    pseudoRange.endId === windowEndId
  ) {
    return pseudoRange
  }
  const nextRange = {
    actorId,
    startId: windowStartId,
    endId: windowEndId,
    startOffset,
    endOffset
  } as PseudoRange
  if (isBackward) {
    nextRange.isBackward = true
  }
  return nextRange
}

export default getNextPseudoRange
