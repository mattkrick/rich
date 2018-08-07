import React from 'react'

export interface BoundingBox {
  top: number
  left: number
  height: number
  width: number
}

interface Props {
  bbox: BoundingBox
  color: string
}

class RemoteSelectionRange extends React.Component<Props> {
  render() {
    const {color, bbox: {top, left, height, width}} = this.props
    const style = {
      position: 'absolute',
      background: color,
      opacity: 0.40,
      top,
      left,
      // matches browser default for things like br to show something was highlighted
      width: Math.max(width, 4),
      height
    } as React.CSSProperties
    return (
      <span style={style}/>
    )
  }
}

export default RemoteSelectionRange
