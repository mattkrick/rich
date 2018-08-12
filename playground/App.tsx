import React from 'react'
import {Editor} from '../src/index'
import FastRTCSwarm from '@mattkrick/fast-rtc-swarm'
import RichConnector, {RICH_CHANGE} from '../src/network/RichConnector'
import strikethroughPlugin from '../src/plugins/strikethroughPlugin'
import RichDoc from "../src/RichDoc";
import {CaretFlagProps} from "../src/components/DefaultCaretFlag";

let privateAddress
// privateAddress = '192.168.1.103' // change this to your router-address address for easy LAN testing
const socket = new WebSocket(`ws://${privateAddress || 'localhost'}:3000`)

interface State {
  doc: RichDoc
}

interface Props {
}

const caretFlag = (_props: CaretFlagProps) => {
  return 'Matt'
}

class App extends React.Component<Props, State> {
  state = {
    doc: new RichDoc('1', (window as any)._VAL_, [strikethroughPlugin]),
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
    this.richConnector.addSwarm(this.swarm)
    this.swarm.on('signal', (signal) => {
      socket.send(JSON.stringify(signal))
    })
    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      this.swarm.dispatch(payload)
    })
  }

  createRichConnector() {
    const {doc} = this.state
    this.richConnector = new RichConnector()
    this.richConnector.addDoc(doc)
    this.richConnector.on(RICH_CHANGE, () => {
      this.forceUpdate()
    })
  }

  onChange = (doc: RichDoc, isContentUpdate: boolean) => {
    this.richConnector.dispatch(doc.id)
    if (isContentUpdate) {
      this.forceUpdate()
    }
  }

  render() {
    const {doc} = this.state
    return (
      <div
        style={{
          margin: 24,
          width: 300,
          border: '1px solid black',
          background: 'rgba(0,0,255,0.08)'
        }}
      >
        <Editor onChange={this.onChange} doc={doc} caretFlag={caretFlag} />
      </div>
    )
  }
}

export default App
