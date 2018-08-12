import { AutomergeNode } from '../components/Editor'
import getIsBackward from './getIsBackward'
import getContainerByObjectId from '../content/getContainerByObjectId'

interface PseudoRange {
  startOffset: number
  endOffset: number
  isBackward: boolean
  isCollapsed: boolean
}

export interface RichRange extends PseudoRange {
  startId: string
  endId: string
}

export interface CachedRange extends PseudoRange {
  startContainer: Node
  endContainer: Node
}

class LocalRange {
  root: RichRange | undefined = undefined
  isDirty: boolean = false
  cachedRange?: CachedRange

  toWindow (rootEl: Node): boolean {
    const selection = window.getSelection()
    if (!this.root || !selection.rangeCount) return false
    const windowRange = selection.getRangeAt(0)
    const { startId, endId } = this.root
    const startContainer = getContainerByObjectId(startId, rootEl)
    const endContainer = endId === startId ? startContainer : getContainerByObjectId(endId, rootEl)
    if (
      windowRange.startContainer === startContainer &&
      windowRange.endContainer === endContainer &&
      windowRange.startOffset === this.root.startOffset &&
      windowRange.endOffset === this.root.endOffset
    ) {
      return false
    }

    // does't handle isBackward, because lazy && unlikely
    const { textContent: startText } = startContainer as Node
    const maxLen = (startText && startText.length) || 0
    windowRange.setStart(startContainer!, Math.min(maxLen, this.root.startOffset))

    const { textContent: endText } = endContainer as Node
    const endTextLen = (endText && endText.length) || 0
    windowRange.setEnd(endContainer!, Math.min(endTextLen, this.root.endOffset))
    return true
  }

  cacheRange () {
    const selection = window.getSelection()
    if (!selection.rangeCount) {
      if (this.root) {
        this.isDirty = true
        this.cachedRange = undefined
      }
    } else {
      const isBackward = getIsBackward(selection)
      const range = selection.getRangeAt(0)
      const { startContainer, startOffset, endContainer, endOffset } = range
      const isCollapsed = endContainer === startContainer && endOffset === startOffset
      this.cachedRange = {
        startContainer,
        startOffset,
        endContainer,
        endOffset,
        isBackward,
        isCollapsed
      }
    }
    return this
  }

  fromCache (): boolean {
    if (!this.cachedRange) {
      return this.isDirty
    }
    const { startContainer, endContainer, ...partialRoot } = this.cachedRange
    const nextRoot = {
      ...partialRoot,
      startId: (startContainer._json as AutomergeNode)._objectId,
      endId: (endContainer._json as AutomergeNode)._objectId
    }
    if (
      !this.root ||
      nextRoot.startId !== this.root.startId ||
      nextRoot.endId !== this.root.endId ||
      nextRoot.startOffset !== this.root.startOffset ||
      nextRoot.endOffset !== this.root.endOffset ||
      nextRoot.isBackward !== this.root.isBackward
    ) {
      this.isDirty = true
      this.root = nextRoot
      return true
    }
    return false
  }

  flush () {
    this.isDirty = false
    return this.root
  }
}

export default LocalRange
