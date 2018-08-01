import React from 'react'
import * as ReactDOM from 'react-dom'
import {
  AutomergeRoot,
  AutomergeNode,
  TemporaryNode,
  Schema,
  AutomergeElement,
  AutomergeTextNode
} from "./Editor";

export type RichNode = Node & {
  _json: AutomergeNode
}

export interface QueuedRichNode extends Node {
  _json: TemporaryNode
}

interface Props {
  node: AutomergeNode
  schema?: Schema
}

const getElementType = (node: AutomergeElement, schema?: Schema) => {
  const {tagName, meta} = node
  if (meta) {
    return tagName
    // TODO support custom nodes similar to how draft does it
    // const tag = schema(node)
    // if (tag) return tag
  }
  return tagName
}

const renderText = (node: AutomergeTextNode) => {
  return node.content.join('')
}

const renderElement = (node: AutomergeElement, schema?: Schema) => {
  const element = getElementType(node, schema)
  const {children, attributes} = node as any
  const reactChildren = children && children.length ? children.map((child: AutomergeNode) => {
    return <DocNode node={child} schema={schema} key={child._objectId} />
  }) : undefined
  return React.createElement(element, {...attributes, key: node._objectId}, reactChildren)
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
    const node = ReactDOM.findDOMNode(this) as any
    node._json = this.props.node
  }

  render() {
    const {node, schema} = this.props
    return renderNodeType(node, schema)
  }
}

export default DocNode
