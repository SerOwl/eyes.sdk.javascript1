import type {
  Driver as CustomDriver,
  Context as CustomContext,
  Element as CustomElement,
  Selector as CustomSelector,
} from './spec-driver/custom'
import type {Driver as WDDriver, Element as WDElement, Selector as WDSelector} from './spec-driver/webdriver'
import os from 'os'
import path from 'path'
import {makeSDK, checkSpecDriver} from '@applitools/eyes-sdk-core'
import {makeLogger} from '@applitools/logger'
import {makeHandler, type HandlerOptions} from './handler'
import {makeSocket} from './socket'
import {makeRefer} from './refer'
import {withTracker} from './debug/tracker'
import {makeSpec} from './spec-driver/custom'
import * as webdriverSpec from './spec-driver/webdriver'

const LOG_DIRNAME = process.env.APPLITOOLS_LOG_DIR ?? path.resolve(os.tmpdir(), `applitools-logs`)

export type ServerOptions = HandlerOptions & {
  debug?: boolean
  shutdownMode?: 'lazy' | 'stdin'
  idleTimeout?: number
  printStdout?: boolean
}

export async function makeServer({
  debug = false,
  shutdownMode = 'lazy',
  idleTimeout = 900000, // 15min
  printStdout = false,
  ...handlerOptions
}: ServerOptions = {}): Promise<{port: number; close: () => void}> {
  const {server, port} = await makeHandler({...handlerOptions, debug})
  console.log(port) // NOTE: this is a part of the generic protocol
  process.send?.({name: 'port', payload: {port}}) // NOTE: this is a part of the js specific protocol
  if (!server) {
    console.log(`You are trying to spawn a duplicated server, use the server on port ${port} instead`)
    return
  }
  if (!printStdout) process.stdout.write = () => true // NOTE: prevent any write to stdout

  const baseLogger = makeLogger({
    handler: {type: 'rolling file', name: 'eyes', dirname: LOG_DIRNAME},
    label: 'eyes',
    level: 'info',
    colors: false,
  })

  console.log(`Logs saved in: ${LOG_DIRNAME}`)
  baseLogger.log('Server is started')

  let idle: any
  let serverClosed = false
  if (shutdownMode === 'stdin') {
    process.stdin.resume()
    process.stdin.on('end', () => {
      server.close()
    })
  } else if (shutdownMode === 'lazy') {
    if (idleTimeout) {
      idle = setTimeout(() => server.close(), idleTimeout)
    }
  }

  server.on('close', () => {
    clearTimeout(idle)
    serverClosed = true
  })

  server.on('connection', client => {
    const refer = makeRefer()
    const socket = withTracker({
      debug,
      socket: makeSocket(client, {logger: baseLogger}),
    })

    if (shutdownMode === 'lazy' && idleTimeout) {
      clearTimeout(idle)
      socket.on('close', () => {
        if (server.clients.size > 0 || serverClosed) return
        idle = setTimeout(() => server.close(), idleTimeout)
      })
    }

    const logger = baseLogger.extend({
      console: {
        log: (message: string) => socket.emit('Server.log', {level: 'info', message}),
        warn: (message: string) => socket.emit('Server.log', {level: 'warn', message}),
        error: (message: string) => socket.emit('Server.log', {level: 'error', message}),
        fatal: (message: string) => socket.emit('Server.log', {level: 'fatal', message}),
      },
    })

    logger.console.log(`Logs saved in: ${LOG_DIRNAME}`)

    socket.command('Server.getInfo', async () => {
      return {logsDir: LOG_DIRNAME}
    })

    const sdkPromise = socket.create('Core.makeSDK', ({name, version, cwd, commands, protocol}) => {
      const spec = protocol === 'webdriver' ? webdriverSpec : makeSpec({socket, commands})
      return makeSDK<
        CustomDriver | WDDriver,
        CustomContext | WDDriver,
        CustomElement | WDElement,
        CustomSelector | WDSelector
      >({
        name: `eyes-universal/${name}`,
        version: `${require('../package.json').version}/${version}`,
        cwd,
        spec,
      }) as any
    })

    socket.command('Core.makeManager', async config => {
      const sdk = await sdkPromise
      const managerRef = refer.ref(await sdk.makeManager(config))
      return managerRef
    })
    socket.command('Core.getViewportSize', async ({driver}) => {
      const sdk = await sdkPromise
      return sdk.getViewportSize({logger, driver})
    })
    socket.command('Core.setViewportSize', async ({driver, size}) => {
      const sdk = await sdkPromise
      return sdk.setViewportSize({logger, driver, size})
    })
    socket.command('Core.closeBatches', async ({settings}) => {
      const sdk = await sdkPromise
      return sdk.closeBatches({logger, settings})
    })
    socket.command('Core.deleteTest', async ({settings}) => {
      const sdk = await sdkPromise
      return sdk.deleteTest({logger, settings})
    })

    socket.command('EyesManager.openEyes', async ({manager, driver, config}) => {
      const eyes = await refer.deref<any>(manager).openEyes({logger, driver, config})
      const eyesRef = refer.ref(eyes, manager)
      return eyesRef
    })
    socket.command('EyesManager.closeManager', async ({manager, throwErr}) => {
      return refer.deref<any>(manager).closeManager({throwErr})
    })

    socket.command('Eyes.check', async ({eyes, settings, config, driver}) => {
      return refer.deref<any>(eyes).check({settings, config, driver})
    })
    socket.command('Eyes.locate', async ({eyes, settings, config}) => {
      return refer.deref<any>(eyes).locate({settings, config})
    })
    socket.command('Eyes.extractTextRegions', async ({eyes, settings, config}) => {
      return refer.deref<any>(eyes).extractTextRegions({settings, config})
    })
    socket.command('Eyes.extractText', async ({eyes, regions, config}) => {
      return refer.deref<any>(eyes).extractText({regions, config})
    })
    socket.command('Eyes.close', async ({eyes, throwErr}) => {
      const results = await refer.deref<any>(eyes).close({throwErr})
      refer.destroy(eyes)
      return results
    })
    socket.command('Eyes.abort', async ({eyes}) => {
      const results = refer.deref<any>(eyes)?.abort()
      refer.destroy(eyes)
      return results
    })

    socket.command('Debug.checkSpecDriver', async ({driver, commands}) => {
      return checkSpecDriver({spec: makeSpec({socket, commands}), driver})
    })
    socket.command('Debug.getHistory', async () => {
      return socket.getHistory()
    })
  })

  return {port, close: () => server.close()}
}
