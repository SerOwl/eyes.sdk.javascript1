import {makeCore} from '@applitools/core'
import * as api from '@applitools/eyes-api'
import * as spec from './spec-driver'
import type {Driver, Element, Selector} from './spec-driver'

const sdk: any = makeCore({
  agentId: `eyes.nightwatch/${require('../package.json').version}`,
  spec,
})

export * from '@applitools/eyes-api'

export {Driver, Element, Selector}

export class Eyes extends api.Eyes<Driver, Element, Selector> {
  protected static readonly _spec = sdk
  static setViewportSize: (driver: Driver, viewportSize: api.RectangleSize) => Promise<void>
}

export type ConfigurationPlain = api.ConfigurationPlain<Element, Selector>

export class Configuration extends api.Configuration<Element, Selector> {
  protected static readonly _spec = sdk
}

export type OCRRegion = api.OCRRegion<Element, Selector>

export type CheckSettingsPlain = api.CheckSettingsAutomationPlain<Element, Selector>

export class CheckSettings extends api.CheckSettingsAutomation<Element, Selector> {
  protected static readonly _spec = sdk
}

export const Target = {...api.Target, spec: sdk} as api.Target<Element, Selector>

export class BatchClose extends api.BatchClose {
  protected static readonly _spec = sdk
}

export const closeBatch = api.closeBatch(sdk)
