import React from 'react'
import DocNode, {RichNode} from './DocNode';
import handleMutation from '../mutations/handleMutation';
import observerConfig from '../mutations/observerConfig';
import setSelectionRange from '../ranges/setSelectionRange';
import {Map} from 'immutable'
import getNextPseudoRange from "../ranges/getNextPseudoRange";
import RemoteCursor from "./RemoteCursor";
import getIsBackward from "../ranges/getIsBackward";
import RemoteRangeMap from "../ranges/RemoteRangeMap";
import RichContent from "../content/RichContent";

export type Schema = () => void

interface AutomergeState {
  clock: AutomergeClock
}

interface AutomergeStateMap<P> {
  
}
export interface AutomergeClock {
  [actorId: string]: number
}

export interface AutomergeDoc {
  _state: Map<[P in keyof AutomergeState], number>
  _objectId: string
  _actorId: string
}

interface AutomergeText {
  _objectId: string
  join(delim: string): string
}

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

export interface AutomergeTextNode extends AutomergeDoc {
  type: 'text'
  content: AutomergeText
}

export interface AutomergeElement extends AutomergeDoc {
  type: 'element'
  tagName: string
  attributes: Array<Object>
  children?: Array<AutomergeNode>
  meta?: Object
}

export interface AutomergeRoot extends AutomergeElement {}

export type AutomergeNode = AutomergeTextNode | AutomergeElement

export type AutomergeChanges = Array<Object>

export interface AutomergeProxy {
  insertAt(index: number, numberToDelete?: number): AutomergeProxy

  deleteAt(index: number, numberToDelete?: number): AutomergeProxy

  [key: string]: any
}

export interface PseudoRange {
  actorId: string
  startId: string
  startOffset: number
  endId?: string
  endOffset?: number
  isBackward?: boolean
}

interface Props {
  content: RichContent
  remoteRangeMap: RemoteRangeMap
  schema?: Schema
  onChange: (content: RichContent, localRange: PseudoRange) => void
}

class Editor extends React.Component<Props> {
  observer?: MutationObserver
  rootRef = React.createRef<HTMLDivElement>()
  localRange?: PseudoRange

  componentDidMount() {
    this.observer = new MutationObserver(handleMutation(this))
    this.observer.observe((this.rootRef.current as HTMLDivElement), observerConfig);
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.rootRef.current || !this.observer) return
    const {remoteRangeMap} = this.props
    const rootEl = this.rootRef.current
    // listen to user input
    this.observer.observe(rootEl, observerConfig)
    if (this.localRange) {
      const isChanged = setSelectionRange(this.localRange, rootEl.firstChild as RichNode)
      if (isChanged) {
        // TODO set scroll if needed
      }
    }
    const isChanged = remoteRangeMap.isChanged()
    if (isChanged) {
      this.forceUpdate()
    }
  }

  onSelect = () => {
    // TODO ignore if we already updated & sent this in the handleMutation
    // sending 1 change instead of 2 in rapid succession means fewer renders
    const {content, onChange} = this.props
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const isBackward = getIsBackward(selection)
    const psuedoRange = getNextPseudoRange(this.localRange, range, content.root._actorId, isBackward)
    onChange(content, psuedoRange)
  }

  render() {
    const {content, remoteRangeMap, schema} = this.props
    const style = {
      whiteSpace: 'pre-wrap'
    } as React.CSSProperties
    // ignore DOM mutations made by react, we only care about those my by user input
    if (this.observer) {
      this.observer.disconnect()
    }
    const contentRoot = this.rootRef.current && this.rootRef.current.firstChild as RichNode
    return (
      <React.Fragment>
        <div style={style} contentEditable suppressContentEditableWarning ref={this.rootRef} onSelect={this.onSelect}>
          <DocNode node={content.root} schema={schema} />
        </div>
        <RemoteCursor remoteRangeMap={remoteRangeMap} contentRoot={contentRoot} />
      </React.Fragment>
    )
  }
}

export default Editor
