import { WindowRange } from '../mutations/handleMutation'

const isRangeEqual = (range1: WindowRange, range2: WindowRange) => {
  return (
    range1.startOffset === range2.startOffset &&
    range1.endOffset === range2.endOffset &&
    range1.startContainer === range2.startContainer &&
    range1.endContainer === range2.endContainer
  )
}

export default isRangeEqual
