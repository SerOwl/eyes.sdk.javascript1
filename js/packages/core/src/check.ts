import type {Target, Eyes, Config, CheckSettings, CheckResult} from './types'
import {type Logger} from '@applitools/logger'
import {makeDriver, isDriver, type SpecDriver} from '@applitools/driver'
import * as utils from '@applitools/utils'
import chalk from 'chalk'

type Options<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  type?: TType
  eyes: Eyes<TDriver, TContext, TElement, TSelector, TType>
  target?: Target<TDriver, TContext, TElement, TSelector, TType>
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeCheck<TDriver, TContext, TElement, TSelector, TDefaultType extends 'classic' | 'ufg' = 'classic'>({
  type: defaultType,
  eyes,
  target: defaultTarget,
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector, TDefaultType>) {
  let stepIndex = 0
  return async function check<TType extends 'classic' | 'ufg' = TDefaultType>({
    type = defaultType as any,
    target = defaultTarget as any,
    settings,
    config,
    logger = defaultLogger,
  }: {
    type?: TType
    target?: Target<TDriver, TContext, TElement, TSelector, TType>
    settings?: CheckSettings<TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<CheckResult<TType>[]> {
    settings = {...config?.screenshot, ...config?.check, ...settings}
    settings.fully ??= !settings.region && (!settings.frames || settings.frames.length === 0)
    settings.waitBeforeCapture ??= 100
    settings.stitchMode ??= 'Scroll'
    settings.hideScrollbars ??= true
    settings.hideCaret ??= true
    settings.overlap = {top: 10, bottom: 50, ...settings?.overlap}
    settings.matchLevel ??= 'Strict'
    settings.ignoreCaret ??= true
    settings.sendDom ??=
      eyes.test.account.rcaEnabled || settings.matchLevel === 'Layout' || settings.enablePatterns || settings.useDom
    settings.autProxy ??= eyes.test.server.proxy
    settings.useDom ??= false
    ;(settings as CheckSettings<TElement, TSelector, 'classic'>).retryTimeout ??= 2000
    settings.lazyLoad = settings.lazyLoad === true ? {} : settings.lazyLoad
    if (settings.lazyLoad) {
      settings.lazyLoad.scrollLength ??= 300
      settings.lazyLoad.waitingTime ??= 2000
      settings.lazyLoad.maxAmountToScroll ??= 15000
    }
    settings.stepIndex = stepIndex++
    settings.waitBetweenStitches ??= utils.types.isObject(settings.lazyLoad) ? settings.lazyLoad.waitingTime : 100

    if (settings.matchLevel === 'Content') {
      logger.console.log(chalk.yellow(`The "Content" match level value has been deprecated, use "IgnoreColors" instead.`))
    }

    const driver = isDriver(target, spec) ? await makeDriver({spec, driver: target, logger}) : null
    const typedEyes = await eyes.getTypedEyes({
      type,
      settings: driver && {
        type: driver.isNative ? 'native' : 'web',
        renderers: (settings as CheckSettings<TElement, TSelector, 'ufg'>).renderers,
      },
      logger,
    })
    const results = await typedEyes.check({target: driver ?? target, settings, logger})
    return results
  }
}
