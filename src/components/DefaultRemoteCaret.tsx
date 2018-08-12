import * as React from "react";
import DefaultCaretFlag from "./DefaultCaretFlag";
import {PeerRange} from "../ranges/PeerRanges";

interface Props {
  left: number,
  top: number,
  height: number,
  peerRange: PeerRange
  color: string
  flag: string
}

interface State {
  showFlag: boolean
}

class DefaultRemoteCaret extends React.Component<Props, State> {
  state = {
    showFlag: true
  }

  hideFlagTimer?: number

  componentDidMount() {
    this.scheduleHideFlag()
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.peerRange !== this.props.peerRange) {
      this.scheduleHideFlag()
    }
  }

  componentWillUnmount() {
    clearTimeout(this.hideFlagTimer)
  }

  scheduleHideFlag = () => {
    clearTimeout(this.hideFlagTimer)
    if (!this.state.showFlag) {
      this.setState({
        showFlag: true
      })
    }
    this.hideFlagTimer = window.setTimeout(() => {
      this.setState({
        showFlag: false
      })
    }, 3000)
  }

  render() {
    const {color, left, top, height, flag} = this.props
    const {showFlag} = this.state
    const style = {
      position: 'absolute',
      left,
      top
    } as React.CSSProperties
    const caretStyle = {
      borderLeft: `2px solid ${color}`,
      height,
      position: 'absolute',
      width: 1,
    } as React.CSSProperties
    const topStyle = {
      backgroundColor: color,
      position: 'absolute',
      left: -2,
      top: -2,
      height: 6
    } as React.CSSProperties

    return (
      <div style={style}>
        <span style={caretStyle} />
        <span style={topStyle} />
        {showFlag && <DefaultCaretFlag color={color} flag={flag} />}
      </div>
    )
  }
}

export default DefaultRemoteCaret
