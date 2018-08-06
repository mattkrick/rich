import Automerge, { AutomergeChanges, AutomergeRoot, AutomergeUpdater } from '@mattkrick/automerge'
import fromJSON from './fromJSON'
import fromText from './fromText'

let nextID = 0

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

  root: AutomergeRoot
  id: string
  isDirty: boolean

  constructor (root: AutomergeRoot, id?: string) {
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
    const message = typeof messageOrUpdater === 'string' ? messageOrUpdater : undefined
    const updater = message ? maybeUpdater : messageOrUpdater
    const nextDoc = Automerge.change(this.root, message, updater)
    // pointless for now, but will improve with https://github.com/automerge/automerge/issues/107
    this.isDirty = this.isDirty || nextDoc !== this.root
    this.root = nextDoc
    return this
  }
}

export default RichContent
