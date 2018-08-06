import {AutomergeElement, AutomergeNode} from '../../src/components/Editor'

const {Server} = require('ws')
const http = require('http')
const express = require('express')
const config = require('../webpack.config.dev.js')
const webpack = require('webpack')
const fs = require('fs')
const path = require('path')
const {parse} = require('himalaya')
const Automerge = require('@mattkrick/automerge')
const handleOnMessage = require('@mattkrick/fast-rtc-swarm/server')

const html = fs.readFileSync(path.join(__dirname, './template.html'), 'utf8')
const PORT = 3000
const app = express()
const server = http.createServer(app)
const wss = new Server({server})
server.listen(PORT)
const compiler = webpack(config)
const setContent = (node: AutomergeNode) => {
  if (node.type === 'text') {
    const {content} = node
    node.content = new Automerge.Text()
    node.content.insertAt(0, ...content)
  } else if (node.children) {
    node.children.forEach((child) => {
      setContent(child)
    })
  }
}

// too lazy to make the playground handle imports for now
const fromJSON = (json: AutomergeElement) => {
  return Automerge.change(Automerge.init(), 'init', (proxyDoc: any) => {
    Object.keys(json).forEach((key) => {
      proxyDoc[key] = (json as any)[key]
    })
    setContent(proxyDoc)
  })
}

const val = fromJSON(parse('<div>Hello<div>, there</div> world</div>')[0])
const valStr = Automerge.save(val)

app.use(
  require('webpack-dev-middleware')(compiler, {
    logLevel: 'warn',
    noInfo: false,
    publicPath: config.output.publicPath,
    stats: {
      chunks: false,
      colors: true
    },
    watchOptions: {
      poll: true,
      aggregateTimeout: 300
    }
  })
)

wss.on('connection', (ws: any) => {
  ws.on('message', (message: string) => {
    const payload = JSON.parse(message)
    if (handleOnMessage.default(wss.clients, ws, payload)) return
    if (payload.type === 'change') {
      for (let client of wss.clients) {
        if ((client as any) !== ws && client.readyState === ws.OPEN) {
          client.send(message)
        }
      }
    }
  })
})

app.use('*', (_req: any, res: any) => {
  const html2 = html.replace(
    '<head>',
    `<head><script>window._VAL_=${JSON.stringify(valStr)}</script>`
  )
  res.send(html2)
})
