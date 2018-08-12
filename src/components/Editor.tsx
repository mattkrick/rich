import React from 'react'
import DocNode from './DocNode';
import handleMutation from '../mutations/handleMutation';
import observerConfig from '../mutations/observerConfig';
import RemoteCursor from "./RemoteCursor";
import * as Automerge from "automerge";
import {AutomergeObject} from "automerge";
import RichDoc from "../RichDoc";
import {CaretFlag} from "./DefaultCaretFlag";

export type Schema = () => void

export interface TemporaryTextNode {
  type: 'text'
  content: string
}

export interface TemporaryElement {
  type: 'element'
  tagName: string
  attributes: Array<Object>
  children?: Array<AutomergeNode>
}

export type TemporaryNode = TemporaryTextNode | TemporaryElement

export interface AutomergeTextNode extends AutomergeObject {
  type: 'text'
  content: Automerge.Text
}

export interface AutomergeRootElement extends AutomergeElement {
  _objectId: '00000000-0000-0000-0000-000000000000'
}

export interface AutomergeElement extends AutomergeObject {
  type: 'element'
  tagName: string
  attributes: Array<Object>
  children?: Array<AutomergeNode>
  meta?: Object
}

export type AutomergeNode = AutomergeTextNode | AutomergeElement

interface Props {
  doc: RichDoc
  schema?: Schema
  onChange: (doc: RichDoc, isUpdate: boolean) => void,
  caretFlag?: CaretFlag
}

class Editor extends React.Component<Props> {
  observer?: MutationObserver
  rootRef = React.createRef<HTMLDivElement>()

  componentDidMount() {
    this.rootRef.current!._json = this.props.doc.content.root
    this.observer = new MutationObserver(handleMutation(this))
    this.observer.observe((this.rootRef.current as HTMLDivElement), observerConfig);
  }

  componentDidUpdate() {
    if (!this.rootRef.current || !this.observer) return
    const {doc: {peerRanges, localRange}} = this.props
    const rootEl = this.rootRef.current
    // listen to user input
    this.observer.observe(rootEl, observerConfig)
    const isNewLocalRange = localRange.toWindow(rootEl)
    if (isNewLocalRange) {
      // TODO set scroll if needed
    }

    // TODO verify & possibly refactor
    const isNewPeerRange = peerRanges.flush()
    if (isNewPeerRange) {
      this.forceUpdate()
    }
  }

  onSelect = () => {
    const {doc, onChange} = this.props
    const {localRange} = doc
    const isChanged = localRange.cacheRange().fromCache()
    if (isChanged) {
      onChange(doc, false)
    }
  }

  render() {
    const {doc, caretFlag, schema} = this.props
    const {content, peerRanges} = doc
    const style = {
      whiteSpace: 'pre-wrap'
    } as React.CSSProperties
    // ignore DOM mutations made by react, we only care about those my by user input
    if (this.observer) {
      this.observer.disconnect()
    }
    const rootEl = this.rootRef.current
    return (
      <React.Fragment>
        <div style={style} contentEditable suppressContentEditableWarning ref={this.rootRef} onSelect={this.onSelect}>
          {content.root.children!.map((child) => <DocNode key={child._objectId} node={child} schema={schema} />)}
        </div>
        <RemoteCursor peerRanges={peerRanges} rootEl={rootEl} caretFlag={caretFlag} />
      </React.Fragment>
    )
  }
}

export default Editor
