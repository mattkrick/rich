import React from 'react'
import {Editor} from '../src/rich'
import FastRTCSwarm from '@mattkrick/fast-rtc-swarm'
import RichConnector, {RICH_CHANGE} from '../src/network/RichConnector'
import RemoteRangeMap from '../src/ranges/RemoteRangeMap'
import RichContent from '../src/content/RichContent'
import {PseudoRange} from '../src/components/Editor'
import {DATA_OPEN} from '@mattkrick/fast-rtc-peer'

let privateAddress
// privateAddress = '192.168.1.103' // change this to your router-address address for easy LAN testing
const socket = new WebSocket(`ws://${privateAddress || 'localhost'}:3000`)

interface State {
  content: RichContent
  remoteRangeMap: RemoteRangeMap
}

interface Props {}

class App extends React.Component<Props, State> {
  state = {
    content: RichContent.fromRaw((window as any)._VAL_, '1'),
    remoteRangeMap: new RemoteRangeMap()
  }
  swarm!: FastRTCSwarm
  richConnector!: RichConnector

  constructor(props: Props) {
    super(props)
    this.createRichConnector()
    socket.addEventListener('open', () => {
      this.createSwarm()
    })
  }

  createSwarm() {
    this.swarm = new FastRTCSwarm()
    this.swarm.on('signal', (signal) => {
      socket.send(JSON.stringify(signal))
    })
    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      this.swarm.dispatch(payload)
    })
    this.swarm.on(DATA_OPEN, () => {
      this.richConnector.addSwarm(this.swarm)
    })
  }

  createRichConnector() {
    const {content, remoteRangeMap} = this.state
    this.richConnector = new RichConnector()
    this.richConnector.addDoc(content, remoteRangeMap)
    this.richConnector.on(RICH_CHANGE, (content, remoteRangeMap) => {
      this.setState({
        content,
        remoteRangeMap
      })
    })
  }

  onChange = (content: RichContent, localRange: PseudoRange) => {
    this.richConnector.dispatch(content, localRange)
    if (content.isChanged()) {
      this.setState({content})
    }
  }

  render() {
    const {content, remoteRangeMap} = this.state
    // console.log('content', content)
    return (
      <div
        style={{
          margin: 24,
          width: 300,
          border: '1px solid black',
          background: 'rgba(0,0,255,0.08)'
        }}
      >
        <Editor content={content} onChange={this.onChange} remoteRangeMap={remoteRangeMap} />
      </div>
    )
  }
}

export default App
