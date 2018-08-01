import { AutomergeChanges, AutomergeProxy, AutomergeRoot } from '../components/Editor'
import Automerge from '@mattkrick/automerge'
import fromJSON from './fromJSON'
import fromText from './fromText'

let nextID = 0

export type AutomergeUpdater = (doc: AutomergeProxy) => void

class RichContent {
  static fromRaw(raw: string, id) {
    const doc = Automerge.load(raw)
    return new RichContent(doc, id)
  }

  static fromJSON(json: any, id) {
    const doc = fromJSON(json)
    return new RichContent(doc, id)
  }

  static fromText(text: string, id) {
    const doc = fromText(text)
    return new RichContent(doc, id)
  }

  doc: AutomergeRoot
  id: string
  isDirty: boolean

  constructor(doc: AutomergeRoot, id?: string) {
    this.doc = doc
    this.id = id || String(nextID++)
    this.isDirty = true
  }

  isChanged() {
    const isDirty = this.isDirty
    this.isDirty = false
    return isDirty
  }

  applyChanges_(changes: AutomergeChanges) {
    if (changes) {
      const nextDoc = Automerge.applyChanges(this.doc, changes)
      this.doc = nextDoc
    }
    return this
  }

  change_(messageOrUpdater: string | AutomergeUpdater, maybeUpdater?: AutomergeUpdater) {
    const message = typeof messageOrUpdater === 'string' ? messageOrUpdater : undefined
    const updater = message ? maybeUpdater : messageOrUpdater
    const nextDoc = Automerge.change(this.doc, message, updater)
    // pointless for now, but will improve with https://github.com/automerge/automerge/issues/107
    this.isDirty = this.isDirty || nextDoc !== this.doc
    this.doc = nextDoc
    return this
  }
}

export default RichContent
