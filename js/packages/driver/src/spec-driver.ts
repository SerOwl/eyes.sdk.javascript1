import type {Location, Size, Region} from '@applitools/utils'
import type {ScreenOrientation, Cookie} from './types'
import {type Selector} from './selector'

export type DriverInfo = {
  sessionId?: string
  browserName?: string
  browserVersion?: string
  platformName?: string
  platformVersion?: string
  deviceName?: string
  userAgent?: string
  viewportLocation?: Location
  viewportSize?: Size
  displaySize?: Size
  orientation?: ScreenOrientation
  pixelRatio?: number
  viewportScale?: number
  safeArea?: Region
  statusBarSize?: number
  navigationBarSize?: number
  isW3C?: boolean
  isChrome?: boolean
  isChromium?: boolean
  isEmulation?: boolean
  isMobile?: boolean
  isNative?: boolean
  isAndroid?: boolean
  isIOS?: boolean
  isMac?: boolean
  isWindows?: boolean
  isWebView?: boolean
  features?: {
    shadowSelector?: boolean
    allCookies?: boolean
    canExecuteOnlyFunctionScripts?: boolean
  }
}

export type WaitOptions = {
  state?: 'exist' | 'visible'
  interval?: number
  timeout?: number
}

export interface SpecDriver<TDriver, TContext, TElement, TSelector> {
  // #region UTILITY
  isDriver(driver: any): driver is TDriver
  isContext?(context: any): context is TContext
  isElement(element: any): element is TElement
  isSelector(selector: any): selector is TSelector
  transformDriver?(driver: any): TDriver
  transformElement?(element: any): TElement
  transformSelector?(selector: Selector<TSelector>): TSelector
  untransformSelector?(selector: TSelector | Selector<TSelector>): Selector | null
  extractContext?(element: TDriver | TContext): TContext
  extractSelector?(element: TElement): TSelector
  isStaleElementError(error: any, selector?: TSelector): boolean
  isEqualElements?(context: TContext, element1: TElement, element2: TElement): Promise<boolean>
  extractHostName?(driver: TDriver): string | null
  // #endregion

  // #region COMMANDS
  mainContext(context: TContext): Promise<TContext>
  parentContext?(context: TContext): Promise<TContext>
  childContext(context: TContext, element: TElement): Promise<TContext>
  executeScript(context: TContext, script: ((arg?: any) => any) | string, arg?: any): Promise<any>
  findElement(context: TContext, selector: TSelector, parent?: TElement): Promise<TElement | null>
  findElements(context: TContext, selector: TSelector, parent?: TElement): Promise<TElement[]>
  waitForSelector?(
    context: TContext,
    selector: TSelector,
    parent?: TElement,
    options?: WaitOptions,
  ): Promise<TElement | null>
  setElementText?(context: TContext, element: TElement, text: string): Promise<void>
  getElementText?(context: TContext, element: TElement): Promise<string>
  setWindowSize?(driver: TDriver, size: Size): Promise<void>
  getWindowSize?(driver: TDriver): Promise<Size>
  setViewportSize?(driver: TDriver, size: Size): Promise<void>
  getViewportSize?(driver: TDriver): Promise<Size>
  getCookies?(driver: TDriver | TContext, context?: boolean): Promise<Cookie[]>
  getDriverInfo?(driver: TDriver): Promise<DriverInfo>
  getCapabilities?(driver: TDriver): Promise<Record<string, any>>
  getTitle(driver: TDriver): Promise<string>
  getUrl(driver: TDriver): Promise<string>
  takeScreenshot(driver: TDriver): Promise<Buffer | string>
  click?(context: TContext, element: TElement | TSelector): Promise<void>
  visit?(driver: TDriver, url: string): Promise<void>
  // #endregion

  // #region MOBILE COMMANDS
  getOrientation?(driver: TDriver): Promise<ScreenOrientation>
  setOrientation?(driver: TDriver, orientation: ScreenOrientation): Promise<void>
  getSystemBars?(driver: TDriver): Promise<{
    statusBar: {visible: boolean; x: number; y: number; height: number; width: number}
    navigationBar: {visible: boolean; x: number; y: number; height: number; width: number}
  }>
  getElementRegion?(driver: TDriver, element: TElement): Promise<Region>
  getElementAttribute?(driver: TDriver, element: TElement, attr: string): Promise<string>
  performAction?(driver: TDriver, steps: any[]): Promise<void>
  getCurrentWorld?(driver: TDriver): Promise<string>
  getWorlds?(driver: TDriver): Promise<string[]>
  switchWorld?(driver: TDriver, id: string): Promise<void>
  // #endregion
}
