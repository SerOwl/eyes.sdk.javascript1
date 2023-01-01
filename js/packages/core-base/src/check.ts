import type {ImageTarget, CheckSettings, CheckResult} from './types'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import {transformTarget} from './utils/transform-target'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeCheck({requests, logger: defaultLogger}: Options) {
  return async function check({
    target,
    settings = {},
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings?: CheckSettings
    logger?: Logger
  }): Promise<CheckResult[]> {
    logger.log('Command "check" is called with settings', settings)
    if (!target.isTransformed) {
      target = await transformTarget({target, settings})
    }
    return requests.check({target, settings, logger})
  }
}
