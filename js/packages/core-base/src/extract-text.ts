import type {ImageTarget, ExtractTextSettings} from './types'
import {type MaybeArray} from '@applitools/utils'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import {transformTarget} from './utils/transform-target'
import * as utils from '@applitools/utils'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeExtractText({requests, logger: defaultLogger}: Options) {
  return async function extractText({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings?: MaybeArray<ExtractTextSettings>
    logger?: Logger
  }): Promise<string[]> {
    logger.log('Command "extractText" is called with settings', settings)
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.all(
      settings.map(async settings => {
        target = await transformTarget({target, settings})
        return requests.extractText({target, settings, logger})
      }),
    )
    return results.flat()
  }
}
