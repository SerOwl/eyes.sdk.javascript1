import makeGlobalRunHooks from './hooks'
import {type EyesConfig} from './config'

export default function ({startServer, eyesConfig}: any) {
  return async function (origOn: Cypress.PluginEvents, cypressConfig: Cypress.PluginConfigOptions): Promise<EyesConfig> {
    const {port, closeManager, closeBatches, closeUniversalServer} = await startServer()

    const globalHooks = makeGlobalRunHooks({closeManager, closeBatches, closeUniversalServer})

    if (eyesConfig.eyesIsGlobalHooksSupported) {
      for (const [eventName, eventHandler] of Object.entries(globalHooks)) {
        origOn.call(this, eventName, eventHandler)
      }
    }

    return Object.assign({}, cypressConfig, eyesConfig, {eyesPort: port})
  }
}
