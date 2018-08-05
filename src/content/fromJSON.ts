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
  return Automerge.change(Automerge.init(), 'init', (proxyDoc: AutomergeProxy) => {
    Object.keys(json).forEach(key => {
      proxyDoc[key] = (json as any)[key]
    })
    setContent(proxyDoc)
  })
}

export default fromJSON
