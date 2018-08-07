import Automerge, { AutomergeChanges, AutomergeUpdater } from 'automerge'
import fromJSON from './fromJSON'
import fromText from './fromText'
import { AutomergeRootElement } from '../components/Editor'

let nextID = 0

// all roots are elements
declare module 'automerge' {
  interface AutomergeRoot extends AutomergeRootElement {}
}

class RichContent {
  static fromRaw (raw: string, id: string) {
    const root = Automerge.load(raw)
    return new RichContent(root, id)
  }

  static fromJSON (json: any, id: string) {
    const root = fromJSON(json)
    return new RichContent(root, id)
  }

  static fromText (text: string, id: string) {
    const root = fromText(text)
    return new RichContent(root, id)
  }

  root: AutomergeRootElement
  id: string
  isDirty: boolean

  constructor (root: AutomergeRootElement, id?: string) {
    this.root = root
    this.id = id || String(nextID++)
    this.isDirty = true
  }

  isChanged () {
    const isDirty = this.isDirty
    this.isDirty = false
    return isDirty
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
}

export default RichContent
