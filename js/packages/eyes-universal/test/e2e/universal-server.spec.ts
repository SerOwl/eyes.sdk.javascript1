import WebSocket from 'ws'
import {makeCertificate} from '../utils/certificate'
import {makeServer} from '../../src'

describe('universal-server', () => {
  it('starts server in secure mode', async () => {
    const authority = await makeCertificate({days: 1, selfSigned: true})
    const server = await makeServer({
      cert: authority.certificate,
      key: authority.serviceKey,
      printStdout: true,
    })
    const ws = new WebSocket(`wss://localhost:${server.port}/eyes`, {rejectUnauthorized: false})

    try {
      await new Promise((resolve, reject) => {
        ws.on('open', resolve)
        ws.on('close', reject)
        ws.on('error', reject)
      })
    } finally {
      ws.close()
      server.close()
    }
  })

  it('accepts payload of 256mb', async () => {
    const server = await makeServer({printStdout: true})
    const ws = new WebSocket(`ws://localhost:${server.port}/eyes`)

    try {
      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          const event = {name: 'Server.getInfo', key: 'uuid', payload: ''}
          event.payload = Buffer.alloc(256 * 1024 * 1024 - JSON.stringify(event).length)
            .fill(107)
            .toString('utf8')
          ws.send(JSON.stringify(event))
          ws.on('message', data => {
            if (JSON.parse(data.toString('utf8')).key === event.key) resolve()
          })
        })
        ws.on('close', reject)
        ws.on('error', reject)
      })
    } finally {
      ws.close()
      server.close()
    }
  })
})
