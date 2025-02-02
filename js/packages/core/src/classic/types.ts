import type * as BaseCore from '@applitools/core-base/types'
import type * as AutomationCore from '../automation/types'
import {type Logger} from '@applitools/logger'

export * from '../automation/types'

export type ClassicTarget<TDriver, TContext, TElement, TSelector> =
  | AutomationCore.DriverTarget<TDriver, TContext, TElement, TSelector>
  | AutomationCore.ImageTarget

export interface Core<TDriver, TContext, TElement, TSelector, TEyes = Eyes<TDriver, TContext, TElement, TSelector>>
  extends AutomationCore.Core<TDriver, TContext, TElement, TSelector, TEyes> {
  readonly type: 'classic'
  openEyes(options: {
    target?: AutomationCore.DriverTarget<TDriver, TContext, TElement, TSelector>
    settings: OpenSettings
    eyes?: BaseCore.Eyes[]
    logger?: Logger
  }): Promise<TEyes>
}

export interface Eyes<TDriver, TContext, TElement, TSelector, TTarget = ClassicTarget<TDriver, TContext, TElement, TSelector>>
  extends AutomationCore.Eyes<TDriver, TContext, TElement, TSelector, TTarget> {
  readonly type: 'classic'
  check(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<AutomationCore.CheckResult[]>
  checkAndClose(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<AutomationCore.TestResult[]>
}

export type OpenSettings = AutomationCore.OpenSettings & {
  keepPlatformNameAsIs?: boolean
  useCeilForViewportSize?: boolean
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> & {
  retryTimeout?: number
}
