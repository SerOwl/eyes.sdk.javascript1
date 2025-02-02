import type {MaybeArray} from '@applitools/utils'
import type * as AutomationCore from './automation/types'
import type * as ClassicCore from './classic/types'
import type * as UFGCore from './ufg/types'
import {type Logger} from '@applitools/logger'
import {type Renderer} from '@applitools/ufg-client'

export * from '@applitools/core-base/types'
export * from './automation/types'

export type TypedCore<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.Core<TDriver, TContext, TElement, TSelector>
  : ClassicCore.Core<TDriver, TContext, TElement, TSelector>

export type TypedEyes<
  TDriver,
  TContext,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg',
  TTarget = Target<TDriver, TContext, TElement, TSelector, TType>,
> = TType extends 'ufg'
  ? UFGCore.Eyes<TDriver, TContext, TElement, TSelector, TTarget>
  : ClassicCore.Eyes<TDriver, TContext, TElement, TSelector, TTarget>

export type Target<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.UFGTarget<TDriver, TContext, TElement, TSelector>
  : ClassicCore.ClassicTarget<TDriver, TContext, TElement, TSelector>

export interface Core<TDriver, TContext, TElement, TSelector>
  extends AutomationCore.Core<TDriver, TContext, TElement, TSelector> {
  makeManager<TType extends 'classic' | 'ufg' = 'classic'>(options?: {
    type: TType
    concurrency?: TType extends 'ufg' ? number : never
    agentId?: string
    logger?: Logger
  }): Promise<EyesManager<TDriver, TContext, TElement, TSelector, TType>>
  openEyes<TType extends 'classic' | 'ufg' = 'classic'>(options: {
    type?: TType
    target?: AutomationCore.DriverTarget<TDriver, TContext, TElement, TSelector>
    settings?: Partial<OpenSettings<TType>>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector, TType>>
  locate<TLocator extends string>(options: {
    target?: AutomationCore.DriverTarget<TDriver, TContext, TElement, TSelector> | AutomationCore.ImageTarget
    settings?: Partial<LocateSettings<TLocator, TElement, TSelector>>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<AutomationCore.LocateResult<TLocator>>
}

export interface EyesManager<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> {
  openEyes(options: {
    target?: TDriver
    settings?: Partial<OpenSettings<TType>>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector, TType>>
  closeManager: (options?: {settings?: {throwErr?: boolean}; logger?: Logger}) => Promise<TestResultSummary<TType>>
}

export interface ClassicEyes<
  TDriver,
  TContext,
  TElement,
  TSelector,
  TTarget = Target<TDriver, TContext, TElement, TSelector, 'classic'>,
> extends ClassicCore.Eyes<TDriver, TContext, TElement, TSelector, TTarget> {
  getTypedEyes<TType extends 'classic' | 'ufg' = 'classic'>(options?: {
    type?: TType
    logger?: Logger
  }): Promise<TypedEyes<TDriver, TContext, TElement, TSelector, TType>>
  check<TType extends 'classic' | 'ufg' = 'classic'>(options?: {
    type?: TType
    target?: TTarget
    settings?: Partial<CheckSettings<TElement, TSelector, 'classic'> & CheckSettings<TElement, TSelector, TType>>
    config?: Config<TElement, TSelector, 'classic'> & Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<CheckResult<TType>[]>
  checkAndClose<TType extends 'classic' | 'ufg' = 'classic'>(options?: {
    type?: TType
    target?: TTarget
    settings?: Partial<
      CheckSettings<TElement, TSelector, 'classic'> &
        CloseSettings<'classic'> &
        CheckSettings<TElement, TSelector, TType> &
        CloseSettings<TType>
    >
    config?: Config<TElement, TSelector, 'classic'> & Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<TestResult<TType>[]>
  locateText<TPattern extends string>(options: {
    target?: TTarget
    settings: Partial<LocateTextSettings<TPattern, TElement, TSelector, 'classic'>>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<AutomationCore.LocateTextResult<TPattern>>
  extractText(options: {
    target?: TTarget
    settings: MaybeArray<Partial<ExtractTextSettings<TElement, TSelector, 'classic'>>>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<string[]>
  close(options?: {
    settings?: Partial<CloseSettings<'classic'>>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<TestResult<'classic'>[]>
}

export interface UFGEyes<TDriver, TContext, TElement, TSelector, TTarget = Target<TDriver, TContext, TElement, TSelector, 'ufg'>>
  extends UFGCore.Eyes<TDriver, TContext, TElement, TSelector, TTarget> {
  getTypedEyes<TType extends 'classic' | 'ufg' = 'classic'>(options?: {
    type?: TType
    settings?: {type: 'web' | 'native'; renderers: Renderer[]}
    logger?: Logger
  }): Promise<TypedEyes<TDriver, TContext, TElement, TSelector, TType>>
  check<TType extends 'classic' | 'ufg' = 'ufg'>(options?: {
    type?: TType
    target?: TTarget
    settings?: Partial<CheckSettings<TElement, TSelector, 'ufg'> & CheckSettings<TElement, TSelector, TType>>
    config?: Config<TElement, TSelector, 'ufg'> & Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<CheckResult<TType>[]>
  checkAndClose<TType extends 'classic' | 'ufg' = 'ufg'>(options?: {
    type?: TType
    target?: TTarget
    settings?: Partial<
      CheckSettings<TElement, TSelector, 'ufg'> &
        CloseSettings<'ufg'> &
        CheckSettings<TElement, TSelector, TType> &
        CloseSettings<TType>
    >
    config?: Config<TElement, TSelector, 'ufg'> & Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<TestResult<TType>[]>
  close(options?: {
    settings?: Partial<CloseSettings<'ufg'>>
    config?: Config<TElement, TSelector, 'ufg'>
    logger?: Logger
  }): Promise<TestResult<'ufg'>[]>
}

export type Eyes<
  TDriver,
  TContext,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg',
  TTarget = Target<TDriver, TContext, TElement, TSelector, TType>,
> = TType extends 'ufg'
  ? UFGEyes<TDriver, TContext, TElement, TSelector, TTarget>
  : ClassicEyes<TDriver, TContext, TElement, TSelector, TTarget>

export type Config<TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  open: Partial<OpenSettings<TType>>
  screenshot: Partial<ClassicCore.ScreenshotSettings<TElement, TSelector>>
  check: Partial<Omit<CheckSettings<TElement, TSelector, TType>, keyof ClassicCore.ScreenshotSettings<TElement, TSelector>>>
  close: Partial<CloseSettings<TType>>
}

export type LocateSettings<TLocator extends string, TElement, TSelector> = AutomationCore.LocateSettings<
  TLocator,
  TElement,
  TSelector
>

export type OpenSettings<TType extends 'classic' | 'ufg'> = TType extends 'ufg' ? UFGCore.OpenSettings : ClassicCore.OpenSettings

export type CheckSettings<TElement, TSelector, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.CheckSettings<TElement, TSelector>
  : ClassicCore.CheckSettings<TElement, TSelector>

export type LocateTextSettings<
  TPattern extends string,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg',
> = TType extends 'ufg'
  ? UFGCore.LocateTextSettings<TPattern, TElement, TSelector>
  : ClassicCore.LocateTextSettings<TPattern, TElement, TSelector>

export type ExtractTextSettings<TElement, TSelector, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.ExtractTextSettings<TElement, TSelector>
  : ClassicCore.ExtractTextSettings<TElement, TSelector>

export type CloseSettings<TType extends 'classic' | 'ufg'> = (TType extends 'ufg'
  ? UFGCore.CloseSettings
  : ClassicCore.CloseSettings) & {throwErr?: boolean}

export type CheckResult<TType extends 'classic' | 'ufg'> = TType extends 'ufg' ? UFGCore.CheckResult : ClassicCore.CheckResult

export type TestResult<TType extends 'classic' | 'ufg'> = TType extends 'ufg' ? UFGCore.TestResult : ClassicCore.TestResult

export interface TestResultContainer<TType extends 'classic' | 'ufg'> {
  readonly error?: Error
  readonly result?: TestResult<TType>
  readonly renderer?: TType extends 'ufg' ? Renderer : never
  readonly userTestId?: string
}

export interface TestResultSummary<TType extends 'classic' | 'ufg'> {
  readonly results: TestResultContainer<TType>[]
  readonly passed: number
  readonly unresolved: number
  readonly failed: number
  readonly exceptions: number
  readonly mismatches: number
  readonly missing: number
  readonly matches: number
}
