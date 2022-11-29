import type {Target, CheckSettings, CloseSettings, TestResult} from './types'
import type {
  Eyes as BaseEyes,
  Target as BaseTarget,
  CheckSettings as BaseCheckSettings,
  CloseSettings as BaseCloseSettings,
} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {makeDriver, type SpecDriver} from '@applitools/driver'
import {takeScreenshot} from '../automation/utils/take-screenshot'
import {takeDomCapture} from './utils/take-dom-capture'
import {toBaseCheckSettings} from '../utils/to-base-check-settings'
import {waitForLazyLoad} from '../utils/wait-for-lazy-load'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  eyes: BaseEyes
  target?: Target<TDriver>
  logger?: Logger
}

export function makeCheckAndClose<TDriver, TContext, TElement, TSelector>({
  spec,
  eyes,
  target: defaultTarget,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function checkAndClose({
    target = defaultTarget,
    settings,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings?: CheckSettings<TElement, TSelector> & CloseSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    logger.log('Command "checkAndClose" is called with settings', settings)
    if (!spec?.isDriver(target)) {
      return eyes.checkAndClose({
        target: target as BaseTarget,
        settings: settings as BaseCheckSettings & BaseCloseSettings,
        logger,
      })
    }
    // TODO driver custom config
    const driver = await makeDriver({spec, driver: target, logger})
    if (settings.lazyLoad) await waitForLazyLoad({driver, settings: settings.lazyLoad !== true ? settings.lazyLoad : {}, logger})
    const {elementReferencesToCalculate, getBaseCheckSettings} = toBaseCheckSettings({settings})
    const screenshot = await takeScreenshot({
      driver,
      settings: {...settings, regionsToCalculate: elementReferencesToCalculate},
      logger,
    })

    const baseTarget: BaseTarget = {
      name: await driver.getTitle(),
      source: await driver.getUrl(),
      image: await screenshot.image.toPng(),
      locationInViewport: utils.geometry.location(screenshot.region),
      isTransformed: true,
    }
    const baseSettings = getBaseCheckSettings({calculatedRegions: screenshot.calculatedRegions})
    if (driver.isWeb && settings.sendDom) {
      if (settings.fully) await screenshot.scrollingElement.setAttribute('data-applitools-scroll', 'true')
      else await screenshot.element?.setAttribute('data-applitools-scroll', 'true')
      baseTarget.dom = await takeDomCapture({driver, logger}).catch(() => null)
    }
    if (settings.pageId) {
      const scrollingElement = await driver.mainContext.getScrollingElement()
      const scrollingOffset = driver.isNative ? {x: 0, y: 0} : await scrollingElement.getScrollOffset()
      baseTarget.locationInView = utils.geometry.offset(scrollingOffset, screenshot.region)
      baseTarget.fullViewSize = scrollingElement ? await scrollingElement.getContentSize() : await driver.getViewportSize()
    }
    await screenshot.restoreState()

    const results = await eyes.checkAndClose({target: baseTarget, settings: baseSettings, logger})
    return results
  }
}
