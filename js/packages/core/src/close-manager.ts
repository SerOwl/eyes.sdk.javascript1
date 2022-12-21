import type {Eyes, CloseBatchSettings, TestResult, TestResultContainer, TestResultSummary} from './types'
import type {Core as BaseCore} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {TestError} from './errors/test-error'
import {InternalError} from './errors/internal-error'

type Options<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  core: BaseCore<unknown>
  storage: {eyes: Eyes<TDriver, TContext, TElement, TSelector, TType>; promise?: Promise<TestResult<TType>[]>}[]
  logger?: Logger
}

export function makeCloseManager<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic'>({
  core,
  storage,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector, TType>) {
  return async function closeManager({
    settings,
    logger = defaultLogger,
  }: {settings?: {throwErr?: boolean}; logger?: Logger} = {}): Promise<TestResultSummary<TType>> {
    const containers: TestResultContainer<TType>[][] = await Promise.all(
      storage.map(async ({eyes, promise}) => {
        if (!promise) logger.warn(`The eyes with id "${eyes.test.userTestId}" are going to be auto aborted`)
        try {
          const results: TestResult<TType>[] = await (promise ?? eyes.abort({logger}))
          return results.map(result => {
            return {
              result,
              error: result.status !== 'Passed' ? new TestError(result) : undefined,
              userTestId: result.userTestId,
              renderer: (result as any).renderer,
            }
          })
        } catch (error) {
          return [{error: new InternalError(error), ...error.info}]
        }
      }),
    )

    const batches = storage.reduce((batches, {eyes}) => {
      if (!eyes.test.keepBatchOpen) {
        const settings = {...eyes.test.server, batchId: eyes.test.batchId}
        batches[`${settings.serverUrl}:${settings.apiKey}:${settings.batchId}`] = settings
      }
      return batches
    }, {} as Record<string, CloseBatchSettings>)

    await core.closeBatch({settings: Object.values(batches), logger}).catch(() => null)

    const summary = {
      results: containers.flat(),
      passed: 0,
      unresolved: 0,
      failed: 0,
      exceptions: 0,
      mismatches: 0,
      missing: 0,
      matches: 0,
    }

    for (const container of summary.results) {
      if (container.error) {
        if (settings?.throwErr) throw container.error
        summary.exceptions += 1
      }

      if (container.result) {
        if (container.result.status === 'Failed') summary.failed += 1
        else if (container.result.status === 'Passed') summary.passed += 1
        else if (container.result.status === 'Unresolved') summary.unresolved += 1

        summary.matches += container.result.matches
        summary.missing += container.result.missing
        summary.mismatches += container.result.mismatches
      }
    }

    return summary
  }
}
