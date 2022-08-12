import type {Region} from '@applitools/types'
import type {Target, LocateSettings} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import {transformImage} from './utils/transform-image'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeLocate({requests, logger: defaultLogger}: Options) {
  return async function <TLocator extends string>({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings?: LocateSettings<TLocator>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>> {
    logger.log('Command "locate" is called with settings', settings)
    target.image = await transformImage({image: target.image, settings})
    const results = await requests.locate({target, settings})
    return results
  }
}
