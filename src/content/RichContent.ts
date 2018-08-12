import Automerge, {
  AutomergeChanges,
  AutomergeClock,
  AutomergeUpdater,
  getMissingChanges
} from 'automerge'
import fromJSON from './fromJSON'
import fromText from './fromText'
import { AutomergeRootElement } from '../components/Editor'

// all roots are elements
declare module 'automerge' {
  interface AutomergeRoot extends AutomergeRootElement {}
}

class RichContent {
  static fromRaw (raw: string) {
    const root = Automerge.load(raw)
    return new RichContent(root)
  }

  static fromJSON (json: any) {
    const root = fromJSON(json)
    return new RichContent(root)
  }

  static fromText (text: string) {
    const root = fromText(text)
    return new RichContent(root)
  }

  root: AutomergeRootElement
  isDirty: boolean

  constructor (store: AutomergeRootElement) {
    this.root = store
    this.isDirty = true
  }

  applyChanges_ (changes?: AutomergeChanges) {
    if (changes) {
      const nextDoc = Automerge.applyChanges(this.root, changes)
      this.root = nextDoc
    }
    return this
  }

  change_ (messageOrUpdater: string | AutomergeUpdater, maybeUpdater?: AutomergeUpdater) {
    const nextDoc = Automerge.change(this.root, messageOrUpdater, maybeUpdater)
    // pointless for now, but will improve with https://github.com/automerge/automerge/issues/107
    this.isDirty = this.isDirty || nextDoc !== this.root
    this.root = nextDoc
    return this
  }

  flushChanges (clock: AutomergeClock) {
    this.isDirty = false
    const myOpSet = this.root._state.get('opSet')
    return getMissingChanges(myOpSet, clock)
  }
}

export default RichContent
