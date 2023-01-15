import {type Handler} from './handler'
import debug from 'debug'
const mainLogger = debug('appli')

export type DebugHandler = {
  type: 'debug'
  label?: string
}

export function makeDebugHandler({label}: Omit<DebugHandler, 'type'> = {}): Handler {
  const logger = mainLogger.extend(label ?? 'no-label')

  return {log, warn, error}

  function log(message: string) {
    logger(message)
  }

  function warn(message: string) {
    logger(message)
  }

  function error(message: string) {
    logger(message)
  }
}
