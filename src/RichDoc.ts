import RichContent from './content/RichContent'
import PeerRanges from './ranges/PeerRanges'
import LocalRange from './ranges/LocalRange'

interface SupportedPluginHandlers {
  // DOMAttributes
  onKeyDown?: (event: KeyboardEvent) => boolean | void
}

type RichPlugin = (doc: RichDoc) => SupportedPluginHandlers

class RichDoc {
  content: RichContent
  peerRanges: PeerRanges
  plugins: Array<RichPlugin>
  id: string
  localRange: LocalRange

  constructor (id: string, rawContent: string, plugins: Array<RichPlugin> = []) {
    this.content = RichContent.fromRaw(rawContent)
    this.peerRanges = new PeerRanges()
    this.localRange = new LocalRange()
    this.plugins = plugins
    this.id = id
  }

  toggleStyle (_cssObj: any) {
    // if (this.localRange.isCollapsed()))
  }
}

export default RichDoc
