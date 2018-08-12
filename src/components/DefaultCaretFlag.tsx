import * as React from "react";

interface Props {
  color: string
  flag: string
}

export interface CaretFlagProps {
  peerId: string
}

export type CaretFlag = (props: CaretFlagProps) => string

class DefaultCaretFlag extends React.Component<Props> {
  render() {
    const {color, flag} = this.props
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
    return (
      <span style={flagStyle}>{flag}</span>
    )
  }
}

export default DefaultCaretFlag
