import type {Region} from '@applitools/utils'
import type {ScreenshotSettings} from '../../classic/types'
import {type Logger} from '@applitools/logger'
import {type Driver, type Element} from '@applitools/driver'
import {takeScreenshot as legacyTakeScreenshot} from '@applitools/screenshoter'
import * as utils from '@applitools/utils'

export type Screenshot = {
  image: any
  region: Region
  element: Element<unknown, unknown, unknown, unknown>
  scrollingElement: Element<unknown, unknown, unknown, unknown>
  restoreState(): Promise<void>
  calculatedRegions: []
}

export async function takeScreenshot<TDriver, TContext, TElement, TSelector>({
  driver,
  settings,
  logger,
}: {
  driver: Driver<TDriver, TContext, TElement, TSelector>
  settings: ScreenshotSettings<TElement, TSelector> & {regionsToCalculate?: any[]}
  logger: Logger
}): Promise<Screenshot> {
  return legacyTakeScreenshot({
    driver,
    frames: settings.frames?.map(frame => {
      return utils.types.isPlainObject(frame) && utils.types.has(frame, 'frame')
        ? {reference: frame.frame, scrollingElement: frame.scrollRootElement}
        : {reference: frame}
    }),
    webview: settings.webview,
    region: settings.region,
    fully: settings.fully,
    hideScrollbars: settings.hideScrollbars,
    hideCaret: settings.hideCaret,
    scrollingMode: settings.stitchMode?.toLowerCase(),
    overlap: settings.overlap,
    wait: settings.waitBeforeCapture,
    framed: driver.isNative,
    lazyLoad: settings.lazyLoad,
    stabilization: settings.normalization && {
      crop: settings.normalization.cut,
      scale: settings.normalization.scaleRatio,
      rotation: settings.normalization.rotation,
    },
    debug: settings.debugImages,
    logger,
    regionsToCalculate: settings.regionsToCalculate,
  })
}
