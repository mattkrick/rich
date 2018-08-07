import React, {ReactElement} from 'react'
import * as ReactDOM from 'react-dom'
import {AutomergeElement, AutomergeNode, AutomergeTextNode, Schema, TemporaryNode} from "./Editor";

declare global {
  interface Node {
    _json?: AutomergeNode | TemporaryNode
  }
}

interface Props {
  node: AutomergeNode
  schema?: Schema
}

const getElementType = (node: AutomergeElement, schema?: Schema) => {
  const {tagName, meta} = node
  if (meta) {
    return tagName
    schema
    // TODO support custom nodes similar to how draft does it
    // const tag = schema(node)
    // if (tag) return tag
  }
  return tagName
}

const renderText = (node: AutomergeTextNode) => {
  return node.content.join('')
}

const renderElement = (node: AutomergeElement, schema?: Schema): ReactElement<{}> => {
  const Element = getElementType(node, schema)
  const {children, attributes} = node
  return (
    <Element key={node._objectId} {...attributes}>
      {children && children.map((child: AutomergeNode) => (
        <DocNode node={child} schema={schema} key={child._objectId} />
      ))}
    </Element>
  )
}

const renderNodeType = (node: AutomergeNode, schema?: Schema) => {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'element':
      return renderElement(node, schema)
    default:
      return null
  }
}

class DocNode extends React.Component<Props> {

  componentDidMount() {
    this.updateNode()
  }

  componentDidUpdate() {
    this.updateNode()
  }

  updateNode() {
    const node = ReactDOM.findDOMNode(this)!
    node._json = this.props.node
  }

  render() {
    const {node, schema} = this.props
    return renderNodeType(node, schema)
  }
}

export default DocNode
