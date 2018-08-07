import React from 'react'
import DefaultRemoteCaret from "./DefaultRemoteCaret";
import getRemoteRangeBBox from '../ranges/getRemoteRangeBBox'
import RemoteSelectionRange, {BoundingBox} from "./RemoteSelectionRange";
import getActorColor from "../ranges/getNextColor";
import RemoteRangeMap from "../ranges/RemoteRangeMap";

interface Props {
  remoteRangeMap: RemoteRangeMap
  contentRoot?: Node
}


class RemoteCursor extends React.Component<Props> {
  render() {
    const {remoteRangeMap, contentRoot} = this.props
    if (!contentRoot) return null
    return remoteRangeMap.map((pseudoRange, actorId) => {
      const result = getRemoteRangeBBox(pseudoRange, contentRoot)
      if (!result) return null
      const {selectionBoxes, caretCoords: {left, top, height}} = result
      const color = getActorColor(actorId)
      return (
        <React.Fragment key={actorId}>
          <DefaultRemoteCaret left={left} top={top} height={height} pseudoRange={pseudoRange} color={color} />
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
