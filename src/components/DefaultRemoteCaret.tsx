import * as React from "react";
import DefaultCaretFlag from "./DefaultCaretFlag";
import {PseudoRange} from "./Editor";

interface Props {
  left: number,
  top: number,
  height: number,
  pseudoRange: PseudoRange
  color: string
}

interface State {
  pseudoRange?: PseudoRange
  showFlag: boolean
}

class DefaultRemoteCaret extends React.Component<Props, State> {
  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.pseudoRange === prevState.pseudoRange) return null
    return {
      pseudoRange: nextProps.pseudoRange,
      showFlag: true
    }
  }

  state = {
    pseudoRange: undefined,
    showFlag: true
  }

  hideFlagTimer?: number

  componentDidMount() {
    this.scheduleHideFlag()
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    const {pseudoRange} = this.state
    if (prevState.pseudoRange !== pseudoRange) {
      this.scheduleHideFlag()
    }
  }

  componentWillUnmount() {
    clearTimeout(this.hideFlagTimer)
  }

  scheduleHideFlag = () => {
    clearTimeout(this.hideFlagTimer)
    this.hideFlagTimer = window.setTimeout(() => {
      this.setState({
        showFlag: false
      })
    }, 3000)
  }

  render() {
    const {color, left, top, height, pseudoRange} = this.props
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
        {showFlag && <DefaultCaretFlag color={color} pseudoRange={pseudoRange} />}
      </div>
    )
  }
}

export default DefaultRemoteCaret
