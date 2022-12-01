import {Server as HttpServer, request as httpRequest} from 'http'
import {Server as HttpsServer, request as httpsRequest} from 'https'
import {Server as WsServer, type AddressInfo} from 'ws'

const {name, version} = require('../package.json')
const TOKEN_HEADER = 'x-eyes-universal-token'
const TOKEN = `${name}@${version}`

export type HandlerOptions = {
  port?: number
  singleton?: boolean
  portResolutionMode?: 'next' | 'random' | 'lazy'
  debug?: boolean
  key?: string | Buffer
  cert?: string | Buffer
}

export async function makeHandler(options: HandlerOptions = {}): Promise<{server?: WsServer; port: number}> {
  const {port = 21077, singleton = true, debug = false, portResolutionMode = 'next', cert, key} = options
  const secure = Boolean(cert && key)

  const http = secure ? new HttpsServer({cert, key}) : new HttpServer()
  http.on('request', (request, response) => {
    if (request.url === '/handshake') {
      const token = debug ? request.headers[TOKEN_HEADER] : TOKEN
      if (request.headers[TOKEN_HEADER] === token) {
        response.writeHead(200, {[TOKEN_HEADER]: token})
      } else {
        response.writeHead(400)
      }
      response.end()
    }
  })

  http.listen(port, 'localhost')

  return new Promise((resolve, reject) => {
    http.on('listening', () => {
      const ws = new WsServer({server: http, path: '/eyes', maxPayload: 256 * 1024 * 1024})
      ws.on('close', () => http.close())
      resolve({server: ws, port: (http.address() as AddressInfo).port})
    })

    http.on('error', async (err: Error & {code: string}) => {
      if (portResolutionMode !== 'lazy' && err.code === 'EADDRINUSE') {
        if (singleton && (await isHandshakable({port, secure}))) {
          return resolve({port})
        } else {
          return resolve(await makeHandler({...options, port: portResolutionMode === 'next' ? port + 1 : 0}))
        }
      }
      reject(err)
    })
  })
}

async function isHandshakable({port, secure}: {port: number; secure?: boolean}): Promise<boolean> {
  const request = secure ? httpsRequest : httpRequest
  return new Promise(resolve => {
    const handshake = request(`${secure ? 'https' : 'http'}://localhost:${port}/handshake`, {
      headers: {[TOKEN_HEADER]: TOKEN},
    })
    handshake.on('response', ({statusCode, headers}) => {
      resolve(statusCode === 200 && headers[TOKEN_HEADER] === TOKEN)
    })
    handshake.on('error', () => resolve(false))
    handshake.end()
  })
}
