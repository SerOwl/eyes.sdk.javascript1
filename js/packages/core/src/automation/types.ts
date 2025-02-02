import type {MaybeArray, Size, Region} from '@applitools/utils'
import type * as BaseCore from '@applitools/core-base/types'
import {type Driver, type Selector} from '@applitools/driver'
import {type Logger} from '@applitools/logger'

export * from '@applitools/core-base/types'

export type DriverTarget<TDriver, TContext, TElement, TSelector> = TDriver | Driver<TDriver, TContext, TElement, TSelector>

export interface Core<TDriver, TContext, TElement, TSelector, TEyes = Eyes<TDriver, TContext, TElement, TSelector>>
  extends BaseCore.Core<TEyes> {
  isDriver(driver: any): driver is TDriver
  isElement(element: any): element is TElement
  isSelector(selector: any): selector is TSelector
  getViewportSize(options: {target: DriverTarget<TDriver, TContext, TElement, TSelector>; logger?: Logger}): Promise<Size>
  setViewportSize(options: {
    target: DriverTarget<TDriver, TContext, TElement, TSelector>
    size: Size
    logger?: Logger
  }): Promise<void>
  openEyes(options: {
    target?: DriverTarget<TDriver, TContext, TElement, TSelector>
    settings: BaseCore.OpenSettings
    eyes?: BaseCore.Eyes[]
    logger?: Logger
  }): Promise<TEyes>
  locate<TLocator extends string>(options: {
    target: DriverTarget<TDriver, TContext, TElement, TSelector> | BaseCore.ImageTarget
    settings: LocateSettings<TLocator, TElement, TSelector>
    logger?: Logger
  }): Promise<BaseCore.LocateResult<TLocator>>
}

export interface Eyes<TDriver, TContext, TElement, TSelector, TTarget = DriverTarget<TDriver, TContext, TElement, TSelector>>
  extends BaseCore.Eyes<TTarget> {
  getBaseEyes(options?: {logger?: Logger}): Promise<BaseCore.Eyes[]>
  check(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<BaseCore.CheckResult[]>
  checkAndClose(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector> & BaseCore.CloseSettings
    logger?: Logger
  }): Promise<BaseCore.TestResult[]>
  locateText?<TPattern extends string>(options: {
    target?: TTarget
    settings: LocateTextSettings<TPattern, TElement, TSelector>
    logger?: Logger
  }): Promise<BaseCore.LocateTextResult<TPattern>>
  extractText?(options: {
    target?: TTarget
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector>>
    logger?: Logger
  }): Promise<string[]>
}

type RegionReference<TElement, TSelector> = Region | ElementReference<TElement, TSelector>
type ElementReference<TElement, TSelector> = TElement | Selector<TSelector>
type FrameReference<TElement, TSelector> = ElementReference<TElement, TSelector> | string | number
type ContextReference<TElement, TSelector> = {
  frame: FrameReference<TElement, TSelector>
  scrollRootElement?: ElementReference<TElement, TSelector>
}
type StitchMode = 'Scroll' | 'CSS'
export interface ScreenshotSettings<TElement, TSelector> extends BaseCore.ImageSettings<RegionReference<TElement, TSelector>> {
  frames?: (ContextReference<TElement, TSelector> | FrameReference<TElement, TSelector>)[]
  fully?: boolean
  scrollRootElement?: ElementReference<TElement, TSelector>
  stitchMode?: StitchMode
  hideScrollbars?: boolean
  hideCaret?: boolean
  overlap?: {top?: number; bottom?: number}
  waitBeforeCapture?: number
  waitBetweenStitches?: number
  lazyLoad?: boolean | {scrollLength?: number; waitingTime?: number; maxAmountToScroll?: number}
  webview?: boolean | string
}

export type LocateSettings<TLocator extends string, TElement, TSelector> = BaseCore.LocateSettings<
  TLocator,
  RegionReference<TElement, TSelector>
> &
  ScreenshotSettings<TElement, TSelector>

export type CheckSettings<TElement, TSelector> = BaseCore.CheckSettings<RegionReference<TElement, TSelector>> &
  ScreenshotSettings<TElement, TSelector>

export type LocateTextSettings<TPattern extends string, TElement, TSelector> = BaseCore.LocateTextSettings<
  TPattern,
  RegionReference<TElement, TSelector>
> &
  ScreenshotSettings<TElement, TSelector>

export type ExtractTextSettings<TElement, TSelector> = BaseCore.ExtractTextSettings<RegionReference<TElement, TSelector>> &
  ScreenshotSettings<TElement, TSelector>
