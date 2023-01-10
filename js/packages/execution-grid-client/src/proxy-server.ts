import {type AddressInfo} from 'net'
import {type AbortSignal} from 'abort-controller'
import {createServer, type ServerResponse, type Server} from 'http'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeQueue, type Queue} from './queue'
import {makeTunnelManager} from './tunnel'
import {makeProxy} from './proxy'
import {modifyIncomingMessage, type ModifiedIncomingMessage} from './incoming-message'
import * as utils from '@applitools/utils'

export type ServerOptions = {
  egServerUrl?: string
  egTunnelUrl?: string
  egTimeout?: number | string
  egInactivityTimeout?: number | string
  proxyUrl?: string
  eyesServerUrl?: string
  apiKey?: string
  port?: number
  resolveUrls?: boolean
  logger?: Logger
  useSelfHealing?: boolean
}

const RETRY_BACKOFF = [].concat(
  Array(5).fill(2000), // 5 tries with delay 2s (total 10s)
  Array(4).fill(5000), // 4 tries with delay 5s (total 20s)
  10000, // all next tries with delay 10s
)

const RETRY_ERROR_CODES = ['CONCURRENCY_LIMIT_REACHED', 'NO_AVAILABLE_DRIVER_POD']

const getSessionId = (requestUrl: string): string => {
  try {
    return requestUrl.split('/')[2]
  } catch(error) {
    return ''
  }
}

export function makeServer({
  egServerUrl = 'https://exec-wus.applitools.com',
  egTunnelUrl = process.env.APPLITOOLS_EG_TUNNEL_URL,
  egTimeout = process.env.APPLITOOLS_EG_TIMEOUT,
  egInactivityTimeout = process.env.APPLITOOLS_EG_INACTIVITY_TIMEOUT,
  proxyUrl = process.env.APPLITOOLS_PROXY,
  eyesServerUrl = process.env.APPLITOOLS_SERVER_URL,
  apiKey = process.env.APPLITOOLS_API_KEY,
  useSelfHealing,
  port = 0,
  resolveUrls = true,
  logger,
}: ServerOptions = {}): Promise<{url: string; port: number; server: Server}> {
  logger = logger ? logger.extend({label: 'eg-client'}) : makeLogger({label: 'eg-client', colors: true})
  const proxyRequest = makeProxy({
    url: egServerUrl,
    resolveUrls,
    proxy: proxyUrl,
    shouldRetry: async proxyResponse => {
      return proxyResponse.statusCode >= 500 && !utils.types.has(await proxyResponse.json(), 'value')
    },
  })
  const {createTunnel, deleteTunnel} = makeTunnelManager({egTunnelUrl, logger})

  const sessions = new Map()
  const queues = new Map<string, Queue>()
  const metadata = new Map<string, any[]>()

  const server = createServer(async (message, response) => {
    const request = modifyIncomingMessage(message)
    const requestLogger = logger.extend({
      tags: {request: `[${request.method}] ${request.url}`, requestId: utils.general.guid()},
    })

    try {
      if (request.method === 'POST' && /^\/session\/?$/.test(request.url)) {
        return await createSession({request, response, logger: requestLogger})
      } else if (request.method === 'DELETE' && /^\/session\/[^\/]+\/?$/.test(request.url)) {
        return await deleteSession({request, response, logger: requestLogger})
      } else if (useSelfHealing && request.method === 'POST' && /^\/session\/[^\/]+\/element\/?$/.test(request.url)) {
        requestLogger.log('Inspecting element lookup request to collect self-healing metadata')
        const proxyResponse = await proxyRequest({
          request,
          response,
          options: {handle: false},
          logger,
        })
        const {appliCustomData} = await proxyResponse.json()
        if (appliCustomData?.selfHealing?.successfulSelector) {
          requestLogger.log('Self-healed locators detected', appliCustomData.selfHealing)
          const sessionId = getSessionId(request.url)
          const sessionMetadata = metadata.get(sessionId) ? metadata.get(sessionId) : (metadata.set(sessionId, []) && metadata.get(sessionId))
          sessionMetadata.push(appliCustomData.selfHealing)
        } else {
          requestLogger.log('No self-healing metadata found')
        }
        proxyResponse.pipe(response)
        return
      } else if (useSelfHealing && request.method === 'GET' && /^\/session\/[^\/]+\/applitools\/metadata?$/.test(request.url)) {
        requestLogger.log('Session metadata requested, returning', metadata)
        const sessionId = getSessionId(request.url)
        const sessionMetadata = metadata.get(sessionId)
        metadata.delete(sessionId)
        response.writeHead(200).end(JSON.stringify({value: sessionMetadata}))
      } else if (request.method === 'GET' && /^\/session\/[^\/]+\/?$/.test(request.url)) {
        const sessionDetails = {sessionId: getSessionId(request.url), applitools: true}
        requestLogger.log('Session details requested, returning', sessionDetails)
        response.writeHead(200).end(JSON.stringify({value: sessionDetails}))
      } else {
        requestLogger.log('Passthrough request')
        return await proxyRequest({request, response, logger: requestLogger})
      }
    } catch (err) {
      // console.error(err)
      requestLogger.error(`Error during processing request:`, err)
      if (!response.writableEnded) {
        response
          .writeHead(500)
          .end(JSON.stringify({value: {error: 'internal proxy server error', message: err.message, stacktrace: ''}}))
      }
    } finally {
      requestLogger.log(`Request was responded with status ${response.statusCode}`)
    }
  })

  server.listen(port)

  return new Promise<{url: string; port: number; server: Server}>((resolve, reject) => {
    server.on('listening', () => {
      const address = server.address() as AddressInfo
      logger.log(`Proxy server has started on port ${address.port}`)
      resolve({url: `http://localhost:${address.port}`, port: address.port, server})
    })
    server.on('error', async (err: Error) => {
      logger.fatal('Error starting proxy server', err)
      reject(err)
    })
  })

  async function createSession({
    request,
    response,
    logger,
  }: {
    request: ModifiedIncomingMessage
    response: ServerResponse
    logger: Logger
  }): Promise<void> {
    const requestBody = await request.json()

    logger.log(`Request was intercepted with body:`, requestBody)

    const session = {} as any
    session.eyesServerUrl = extractCapability(requestBody, 'applitools:eyesServerUrl') ?? eyesServerUrl
    session.apiKey = extractCapability(requestBody, 'applitools:apiKey') ?? apiKey
    session.tunnelId = extractCapability(requestBody, 'applitools:tunnel') ? await createTunnel(session) : undefined
    session.key = `${session.eyesServerUrl ?? 'default'}:${session.apiKey}`

    const applitoolsCapabilities = {
      'applitools:eyesServerUrl': session.eyesServerUrl,
      'applitools:apiKey': session.apiKey,
      'applitools:x-tunnel-id-0': session.tunnelId,
      'applitools:timeout': extractCapability(requestBody, 'applitools:timeout') ?? egTimeout,
      'applitools:inactivityTimeout':
        extractCapability(requestBody, 'applitools:inactivityTimeout') ?? egInactivityTimeout,
      'applitools:useSelfHealing':
        extractCapability(requestBody, 'applitools:useSelfHealing') ?? useSelfHealing,
    }

    if (requestBody.capabilities) {
      requestBody.capabilities.alwaysMatch = {...requestBody.capabilities?.alwaysMatch, ...applitoolsCapabilities}
    }
    if (requestBody.desiredCapabilities) {
      requestBody.desiredCapabilities = {...requestBody.desiredCapabilities, ...applitoolsCapabilities}
    }

    logger.log('Request body has modified:', requestBody)

    let queue = queues.get(session.key)
    if (!queue) {
      queue = makeQueue({logger: logger.extend({tags: {queue: session.key}})})
      queues.set(session.key, queue)
    }

    request.socket.on('close', () => queue.cancel(task))

    await queue.run(task)

    async function task(signal: AbortSignal, attempt = 1): Promise<void> {
      // do not start the task if it is already aborted
      if (signal.aborted) return

      const proxyResponse = await proxyRequest({
        request,
        response,
        options: {body: JSON.stringify(requestBody), handle: false, signal},
        logger,
      })

      const responseBody = await proxyResponse.json()

      logger.log(`Response was intercepted with body:`, responseBody)

      if (RETRY_ERROR_CODES.includes(responseBody.value?.data?.appliErrorCode)) {
        queue.cork()
        // after query is corked the task might be aborted
        if (signal.aborted) return
        await utils.general.sleep(RETRY_BACKOFF[Math.min(attempt, RETRY_BACKOFF.length - 1)])
        logger.log(
          `Attempt (${attempt}) to create session was failed with applitools status code:`,
          responseBody.value.data.appliErrorCode,
        )
        return task(signal, attempt + 1)
      } else {
        queue.uncork()
        if (responseBody.value?.sessionId) sessions.set(responseBody.value.sessionId, session)
        proxyResponse.pipe(response)
        return
      }
    }
  }

  async function deleteSession({
    request,
    response,
    logger,
  }: {
    request: ModifiedIncomingMessage
    response: ServerResponse
    logger: Logger
  }): Promise<void> {
    const sessionId = getSessionId(request.url)
    logger.log(`Request was intercepted with sessionId:`, sessionId)

    await proxyRequest({request, response, logger})

    const session = sessions.get(sessionId)
    if (session.tunnelId) {
      await deleteTunnel(session)
      logger.log(`Tunnel with id ${session.tunnelId} was deleted for session with id ${sessionId}`)
    }
    sessions.delete(sessionId)
  }

  function extractCapability(
    data: {
      desiredCapabilities?: Record<string, any>
      capabilities?: {alwaysMatch?: Record<string, any>; firstMatch?: Record<string, any>[]}
    },
    capabilityName: string,
  ): any {
    return data.capabilities?.alwaysMatch?.[capabilityName] ?? data.desiredCapabilities?.[capabilityName]
  }
}
