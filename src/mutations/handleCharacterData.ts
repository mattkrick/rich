import * as DMP from 'diff-match-patch'
import { RichNode } from '../components/DocNode'
import { AutomergeProxy, AutomergeTextNode } from '../components/Editor'
import RichContent from '../content/RichContent'

const dmp = new DMP()

interface CharOp {
  contentId: string
  oldValue: string
  target: RichNode
  targetId: string
  newValue: string
}

type Ops = Array<CharOp>

const makeTextDiff = (contentProxy: AutomergeProxy, oldValue: string, newValue: string) => {
  const diffs = dmp.diff_main(oldValue, newValue)
  let idx = 0
  for (let ii = 0; ii < diffs.length; ii++) {
    const diff = diffs[ii]
    if (diff[0] === 0) {
      idx += diff[1].length
    } else if (diff[0] === -1) {
      contentProxy.deleteAt(idx, diff[1].length)
    } else {
      const charArr = diff[1].split('')
      contentProxy.insertAt(idx, ...charArr)
      idx += diff[1].length
    }
  }
}

const commitChanges = (content: RichContent, ops: Ops) => {
  content.change_('char', proxyDoc => {
    ops.forEach(({ oldValue, contentId, newValue }) => {
      const contentProxy = proxyDoc._get(contentId)
      makeTextDiff(contentProxy, oldValue, newValue)
    })
  })
}

const updateSchema = (content: RichContent, ops: Ops) => {
  ops.forEach(({ targetId, target }) => {
    target._json = content.root._state.getIn(['opSet', 'cache', targetId])
  })
}

const handleCharacterData = (
  charQueue: Array<RichNode>,
  contentRoot: RichNode,
  content: RichContent
) => {
  const ops: Ops = []
  for (let ii = 0; ii < charQueue.length; ii++) {
    const target = charQueue[ii]
    const newValue = target.textContent || ''
    const { content, _objectId: targetId } = target._json as AutomergeTextNode
    const oldValue = content.join('')
    // json won't exist if the target was detached, so we can just ignore this
    if (!target._json || oldValue === newValue) continue
    ops.push({
      contentId: content._objectId,
      oldValue,
      target,
      targetId,
      newValue
    })
  }
  if (ops.length) {
    commitChanges(content, ops)
    updateSchema(content, ops)
  }
}

export default handleCharacterData
