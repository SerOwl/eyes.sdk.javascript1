import type {AbortSettings, TestResult} from './types'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeAbort({requests, logger: defaultLogger}: Options) {
  return async function abort({
    settings,
    logger = defaultLogger,
  }: {
    settings?: AbortSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    logger.log('Command "abort" is called with settings', settings)
    const results = await requests.abort({settings, logger})
    return results
  }
}
