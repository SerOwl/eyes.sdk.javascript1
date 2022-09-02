import {makeCore} from '../../../src/ufg/core'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'

describe('native app', () => {
  describe('android', () => {
    let driver, destroyDriver

    before(async () => {
      ;[driver, destroyDriver] = await spec.build({
        device: 'Pixel 3 XL duckduckgo',
        app: 'https://applitools.jfrog.io/artifactory/Examples/duckduckgo-5.87.0-play-debug.apk',
      })
    })

    after(async () => {
      await destroyDriver?.()
    })

    it('works', async () => {
      const core = makeCore({spec, concurrency: 10})
      const eyes = await core.openEyes({
        target: driver,
        settings: {
          serverUrl: 'https://eyesapi.applitools.com',
          apiKey: process.env.APPLITOOLS_API_KEY,
          appName: 'core app',
          testName: 'native ufg android',
        },
      })
      await eyes.check({
        settings: {
          waitBeforeCapture: 1500,
          renderers: [{androidDeviceInfo: {deviceName: 'Pixel 4 XL', version: 'latest'}}],
        },
      })
      const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})
      assert.strictEqual(result.status, 'Passed')
    })
  })

  describe('ios', () => {
    let driver, destroyDriver

    before(async () => {
      ;[driver, destroyDriver] = await spec.build({
        device: 'iPhone 12 UFG native',
        app: 'https://applitools.jfrog.io/artifactory/Examples/DuckDuckGo-instrumented.app.zip',
      })
    })

    after(async () => {
      await destroyDriver?.()
    })

    it('works', async () => {
      const core = makeCore({spec, concurrency: 10})
      const eyes = await core.openEyes({
        target: driver,
        settings: {
          serverUrl: 'https://eyesapi.applitools.com',
          apiKey: process.env.APPLITOOLS_API_KEY,
          appName: 'core app',
          testName: 'native ufg ios',
        },
      })
      await eyes.check({
        settings: {
          waitBeforeCapture: 1500,
          renderers: [{iosDeviceInfo: {deviceName: 'iPhone 12', version: 'latest'}}],
        },
      })
      const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})
      assert.strictEqual(result.status, 'Passed')
    })
  })
})