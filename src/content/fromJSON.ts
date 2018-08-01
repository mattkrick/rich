import Automerge from '@mattkrick/automerge'
import { AutomergeElement, AutomergeProxy } from '../components/Editor'

const setContent = (node: AutomergeProxy) => {
  if (node.type === 'text') {
    const { content } = node
    node.content = new Automerge.Text()
    node.content.insertAt(0, ...content)
  } else if (node.children) {
    node.children.forEach((child: AutomergeProxy) => {
      setContent(child)
    })
  }
}

const fromJSON = (json: AutomergeElement) => {
  return Automerge.change(Automerge.init(), 'init', (doc: AutomergeProxy) => {
    Object.keys(json).forEach(key => {
      doc[key] = (json as any)[key]
    })
    setContent(doc)
  })
}

export default fromJSON
