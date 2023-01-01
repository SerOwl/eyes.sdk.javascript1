import {CoreSpec, CoreEyesManager, CoreEyes, CoreConfig} from './Core'
import {type Logger} from '@applitools/logger'
import {NewTestError} from './errors/NewTestError'
import {DiffsFoundError} from './errors/DiffsFoundError'
import {TestFailedError} from './errors/TestFailedError'
import {RunnerOptions, RunnerOptionsFluent} from './input/RunnerOptions'
import {TestResultsData} from './output/TestResults'
import {TestResultsSummaryData} from './output/TestResultsSummary'
import {Eyes} from './Eyes'
import * as utils from '@applitools/utils'

export abstract class EyesRunner {
  protected _spec: CoreSpec

  private _manager: CoreEyesManager
  private _eyes: Eyes<unknown, unknown, unknown>[] = []

  /** @internal */
  abstract get config(): {type: 'classic' | 'ufg'}

  /** @internal */
  attach<TDriver, TElement, TSelector>(
    eyes: Eyes<TDriver, TElement, TSelector>,
    spec: CoreSpec<TDriver, TElement, TSelector>,
  ) {
    if (!this._spec) this._spec = spec
    this._eyes.push(eyes)
  }

  /** @internal */
  async openEyes<TDriver, TElement, TSelector>(options: {
    target: TDriver
    config?: CoreConfig<TElement, TSelector>
    logger?: Logger
    on?: (name: string, data?: Record<string, any>) => void
  }): Promise<CoreEyes<TDriver, TElement, TSelector>> {
    if (!this._manager) this._manager = await this._spec.makeManager(this.config)

    return await this._manager.openEyes(options)
  }

  async getAllTestResults(throwErr = true): Promise<TestResultsSummaryData> {
    if (!this._manager) return new TestResultsSummaryData()
    const [eyes] = this._eyes
    const deleteTest: typeof this._spec.deleteTest = options =>
      this._spec.deleteTest({
        ...options,
        settings: {
          ...options.settings,
          serverUrl: eyes.configuration.serverUrl,
          apiKey: eyes.configuration.apiKey,
          proxy: eyes.configuration.proxy,
        },
      })
    try {
      const summary = await this._manager.closeManager({settings: {throwErr}})
      return new TestResultsSummaryData({summary, deleteTest})
    } catch (err) {
      if (!err.info?.result) throw err
      const testResult = new TestResultsData({result: err.info.result, deleteTest})
      if (err.reason === 'test failed') {
        throw new TestFailedError(err.message, testResult)
      } else if (err.reason === 'test different') {
        throw new DiffsFoundError(err.message, testResult)
      } else if (err.reason === 'test new') {
        throw new NewTestError(err.message, testResult)
      }
    }
  }
}

export class VisualGridRunner extends EyesRunner {
  private _testConcurrency: number
  private _legacyConcurrency: number

  constructor(options?: RunnerOptions)
  /** @deprecated */
  constructor(options?: RunnerOptionsFluent)
  /** @deprecated */
  constructor(legacyConcurrency?: number)
  constructor(optionsOrLegacyConcurrency?: RunnerOptions | RunnerOptionsFluent | number) {
    super()
    if (utils.types.isNumber(optionsOrLegacyConcurrency)) {
      this._legacyConcurrency = optionsOrLegacyConcurrency
    } else if (optionsOrLegacyConcurrency) {
      const options =
        optionsOrLegacyConcurrency instanceof RunnerOptionsFluent
          ? optionsOrLegacyConcurrency.toJSON()
          : optionsOrLegacyConcurrency
      this._testConcurrency = options.testConcurrency
    }
  }

  /** @internal */
  get config() {
    return {
      type: 'ufg' as const,
      concurrency: this._testConcurrency,
      legacyConcurrency: this._legacyConcurrency,
    }
  }

  get testConcurrency() {
    return this._testConcurrency
  }

  /** @deprecated */
  get legacyConcurrency() {
    return this._legacyConcurrency
  }

  /** @deprecated */
  getConcurrentSessions() {
    return this._legacyConcurrency
  }
}

export class ClassicRunner extends EyesRunner {
  /** @internal */
  get config() {
    return {type: 'classic' as const}
  }
}
