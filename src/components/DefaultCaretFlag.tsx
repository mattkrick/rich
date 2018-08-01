import * as React from "react";
import {PseudoRange} from "./Editor";

interface Props {
  color: string
  pseudoRange: PseudoRange
}

class DefaultCaretFlag extends React.Component<Props> {
  render() {
    const {color, pseudoRange} = this.props
    const flagStyle = {
      backgroundColor: color,
      color: 'white',
      fontSize: 10,
      top: -14,
      left: -2,
      position: 'absolute',
      padding: 2,
      whiteSpace: 'nowrap'
    } as React.CSSProperties
    const {actorId} = pseudoRange
    return (
      <span style={flagStyle}>{actorId}</span>
    )
  }
}

export default DefaultCaretFlag
