import type {SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import type {Core} from '@applitools/types/ufg'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeCore as makeBaseCore} from '@applitools/core-base'
import {makeGetViewportSize} from '../automation/get-viewport-size'
import {makeSetViewportSize} from '../automation/set-viewport-size'
import {makeOpenEyes} from './open-eyes'
import throat from 'throat'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  core?: BaseCore
  agentId?: string
  cwd?: string
  logger?: Logger
}

export function makeCore<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  agentId = 'core-ufg',
  cwd = process.cwd(),
  logger,
}: Options<TDriver, TContext, TElement, TSelector>): Core<TDriver, TElement, TSelector> {
  logger = logger?.extend({label: 'core-ufg'}) ?? makeLogger({label: 'core-ufg'})
  logger.log(`Core ufg is initialized ${core ? 'with' : 'without'} custom base core`)
  core ??= makeBaseCore({agentId, cwd, logger})

  return {
    ...core,
    isDriver: spec.isDriver,
    isElement: spec.isElement,
    isSelector: spec.isSelector,
    getViewportSize: makeGetViewportSize({spec, logger}),
    setViewportSize: makeSetViewportSize({spec, logger}),
    openEyes: makeOpenEyes({spec, core, logger}),
  }
}
