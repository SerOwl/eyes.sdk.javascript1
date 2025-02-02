import {makeCore} from '@applitools/core'
import * as api from '@applitools/eyes-api'
import * as spec from './spec-driver'

const sdk = makeCore({
  agentId: `eyes.nightwatch/${require('../package.json').version}`,
  spec,
})

export * from '@applitools/eyes-api'

export type Driver = spec.Driver
export type Element = spec.Element | spec.ResponseElement
export type Selector = spec.Selector

export class Eyes extends api.Eyes<Driver, Element, Selector> {
  protected static readonly _spec = sdk
  static setViewportSize: (driver: Driver, viewportSize: api.RectangleSize) => Promise<void>
}

export type ConfigurationPlain = api.ConfigurationPlain<Element, Selector>

export class Configuration extends api.Configuration<Element, Selector> {
  protected static readonly _spec = sdk
}

export type OCRRegion = api.OCRRegion<Element, Selector>

export type CheckSettingsAutomationPlain = api.CheckSettingsAutomationPlain<Element, Selector>

export class CheckSettingsAutomation extends api.CheckSettingsAutomation<Element, Selector> {
  protected static readonly _spec = sdk
}

export class CheckSettings extends CheckSettingsAutomation {}

export const Target = {...api.Target, spec: sdk} as api.Target<Element, Selector>

export class BatchClose extends api.BatchClose {
  protected static readonly _spec = sdk
}

export const closeBatch = api.closeBatch(sdk)
