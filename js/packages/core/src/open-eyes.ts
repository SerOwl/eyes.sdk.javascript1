import type {TypedCore, Batch, Eyes, Config, OpenSettings} from './types'
import type {Core as BaseCore} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {type SpecDriver} from '@applitools/driver'
import {makeCore as makeClassicCore} from './classic/core'
import {makeCore as makeUFGCore} from './ufg/core'
import {makeGetTypedEyes} from './get-typed-eyes'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeLocateText} from './locate-text'
import {makeExtractText} from './extract-text'
import {makeClose} from './close'
import * as utils from '@applitools/utils'
import {extractCIProvider} from './utils/extract-ci-provider'

type Options<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  type?: TType
  concurrency?: number
  batch?: Batch
  core: BaseCore
  cores?: {[TKey in 'classic' | 'ufg']: TypedCore<TDriver, TContext, TElement, TSelector, TKey>}
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeOpenEyes<TDriver, TContext, TElement, TSelector, TDefaultType extends 'classic' | 'ufg' = 'classic'>({
  type: defaultType = 'classic' as TDefaultType,
  concurrency,
  batch,
  core,
  cores,
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector, TDefaultType>) {
  return async function openEyes<TType extends 'classic' | 'ufg' = TDefaultType>({
    type = defaultType as any,
    settings,
    config,
    target,
    logger = defaultLogger,
  }: {
    type?: TType
    settings?: Partial<OpenSettings<TDefaultType> & OpenSettings<TType>>
    config?: Config<TElement, TSelector, TDefaultType> & Config<TElement, TSelector, TType>
    target?: TDriver
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector, TType>> {
    settings = {...config?.open, ...settings}
    settings.userTestId ??= `${settings.testName}--${utils.general.guid()}`
    settings.serverUrl ??= utils.general.getEnvValue('SERVER_URL') ?? 'https://eyesapi.applitools.com'
    settings.apiKey ??= utils.general.getEnvValue('API_KEY')
    settings.batch = {...batch, ...settings.batch}
    settings.batch.id ??= utils.general.getEnvValue('BATCH_ID') ?? `generated-${utils.general.guid()}`
    settings.batch.name ??= utils.general.getEnvValue('BATCH_NAME')
    settings.batch.sequenceName ??= utils.general.getEnvValue('BATCH_SEQUENCE')
    settings.batch.notifyOnCompletion ??= utils.general.getEnvValue('BATCH_NOTIFY', 'boolean')
    settings.keepBatchOpen ??= utils.general.getEnvValue('DONT_CLOSE_BATCHES', 'boolean')
    settings.branchName ??= utils.general.getEnvValue('BRANCH')
    settings.parentBranchName ??= utils.general.getEnvValue('PARENT_BRANCH')
    settings.baselineBranchName ??= utils.general.getEnvValue('BASELINE_BRANCH')
    settings.ignoreBaseline ??= false
    settings.compareWithParentBranch ??= false
    if (type === 'ufg') {
      const ufgSettings = settings as OpenSettings<'ufg'>
      const ufgConfig = config as Config<TElement, TSelector, 'ufg'>
      ufgSettings.renderConcurrency ??= ufgConfig?.check?.renderers?.length
    }
    core.logEvent({
      settings: {
        serverUrl: settings.serverUrl,
        apiKey: settings.apiKey,
        proxy: settings.proxy,
        agentId: settings.agentId,
        level: 'Notice',
        event: {
          type: 'runnerStarted',
          testConcurrency: concurrency,
          concurrentRendersPerTest: (settings as OpenSettings<'ufg'>).renderConcurrency,
          node: {version: process.version, platform: process.platform, arch: process.arch},
          driverUrl: target && spec?.extractHostName?.(target),
          extractedCIProvider: extractCIProvider(),
        },
      },
      logger,
    })
    const getTypedEyes = makeGetTypedEyes({
      type,
      settings: settings as OpenSettings<TType>,
      target,
      cores: cores ?? {
        ufg: makeUFGCore({spec, core, concurrency: concurrency ?? 5, logger}),
        classic: makeClassicCore({spec, core, logger}),
      },
      logger,
    })
    const eyes = await getTypedEyes({logger})
    return utils.general.extend(eyes, eyes => ({
      getTypedEyes,
      check: makeCheck({type, eyes, target, spec, logger}),
      checkAndClose: makeCheckAndClose({type, eyes, target, spec, logger}),
      locateText: makeLocateText({eyes, logger}),
      extractText: makeExtractText({eyes, logger}),
      close: makeClose({eyes, target, logger}),
    })) as Eyes<TDriver, TContext, TElement, TSelector, TType>
  }
}
