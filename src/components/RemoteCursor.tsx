import React from 'react'
import DefaultRemoteCaret from "./DefaultRemoteCaret";
import getRemoteRangeBBox from '../ranges/getRemoteRangeBBox'
import RemoteSelectionRange, {BoundingBox} from "./RemoteSelectionRange";
import getActorColor from "../ranges/getNextColor";
import PeerRanges from "../ranges/PeerRanges";
import {CaretFlag, CaretFlagProps} from "./DefaultCaretFlag";

interface Props {
  getName?: (peerId: string) => string
  peerRanges: PeerRanges
  rootEl: Node | null,
  caretFlag?: CaretFlag
}

const defaultCaretFlag = (props: CaretFlagProps) => props.peerId

class RemoteCursor extends React.Component<Props> {
  render() {
    const {caretFlag = defaultCaretFlag, peerRanges, rootEl} = this.props
    if (!rootEl) return null
    return peerRanges.map((peerRange) => {
      const result = getRemoteRangeBBox(peerRange, rootEl)
      if (!result) return null
      const {peerId} = peerRange
      const {selectionBoxes, caretCoords: {left, top, height}} = result
      const color = getActorColor(peerId)
      const flag = caretFlag({peerId})
      return (
        <React.Fragment key={peerId}>
          <DefaultRemoteCaret left={left} top={top} height={height} peerRange={peerRange} color={color} flag={flag}/>
          {selectionBoxes.map((bbox: BoundingBox) => {
            return (
              <RemoteSelectionRange key={bbox.top} bbox={bbox} color={color} />
            )
          })}
        </React.Fragment>
      )
    })
  }
}

export default RemoteCursor
