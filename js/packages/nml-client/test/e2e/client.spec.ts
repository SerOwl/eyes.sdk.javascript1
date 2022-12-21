import {takeScreenshot, takeSnapshots} from '../../src/client'
import {makeProxyServer} from '@applitools/test-server'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'

const env = {
  //android: {
  //  device: 'Pixel 3 XL duckduckgo',
  //  app: 'https://applitools.jfrog.io/artifactory/Examples/duckduckgo-5.87.0-play-debug.apk',
  //},
  ios: {
    device: 'iPhone 13',
    app: 'https://applitools.jfrog.io/artifactory/Examples/IOSTestApp-instrumented-nml-nmg-flat-caps.zip',
    injectUFGLib: true,
    withNML: true,
  },
}

async function extractBrokerUrl(driver: any): Promise<string> {
  const element = await driver.findElement({xpath: '//XCUIElementTypeOther[@name="Applitools_View"]'})
  const result = JSON.parse(await element.getText())
  return result.nextPath
}

describe('client', () => {
  // TODO: enable and verify when test apps received
  describe.skip('takeScreenshot', () => {
    for (const platform of Object.keys(env)) {
      it(`${platform} works`, async () => {
        const [driver, destroyDriver] = await spec.build(env[platform])
        try {
          const brokerUrl = await extractBrokerUrl(driver)
          const screenshotURL = await takeScreenshot({url: brokerUrl, settings: {}})
          new URL(screenshotURL) // will throw if invalid
          //BONUS POINTS: perform a head request and check the content type and size
        } finally {
          await destroyDriver()
        }
      })
    }
  })

  // TODO:
  // Refactor these tests to also support android when needed.
  // (the renderers and assertions are specific to ios, but the test was written
  // to be platform agnostic and dynamic based on the platform type)
  describe('takeSnapshots', () => {
    for (const platform of Object.keys(env)) {
      it(`${platform} works`, async () => {
        const [driver, destroyDriver] = await spec.build(env[platform])
        try {
          const brokerUrl = await extractBrokerUrl(driver)
          const snapshots = await takeSnapshots({
            url: brokerUrl,
            settings: {renderers: [{iosDeviceInfo: {deviceName: 'iPhone 12'}}]},
          })
          assert.strictEqual(snapshots.length, 1)
          assert.strictEqual(snapshots[0].platformName, platform)
          assert.strictEqual(snapshots[0].vhsHash.hashFormat, 'sha256')
          assert.strictEqual(snapshots[0].vhsHash.contentType, 'x-applitools-vhs/ios')
        } finally {
          await destroyDriver()
        }
      })

      it(`${platform} works with a proxy server`, async () => {
        let proxyServer
        const [driver, destroyDriver] = await spec.build(env[platform])
        try {
          proxyServer = await makeProxyServer()
          const brokerUrl = await extractBrokerUrl(driver)
          const snapshots = await takeSnapshots({
            url: brokerUrl,
            settings: {
              renderers: [{iosDeviceInfo: {deviceName: 'iPhone 12'}}],
              proxy: {url: `http://localhost:${proxyServer.port}`},
            },
          })
          assert.strictEqual(snapshots.length, 1)
          assert.strictEqual(snapshots[0].platformName, platform)
          assert.strictEqual(snapshots[0].vhsHash.hashFormat, 'sha256')
          assert.strictEqual(snapshots[0].vhsHash.contentType, 'x-applitools-vhs/ios')
        } finally {
          await destroyDriver?.()
          await proxyServer?.close()
        }
      })
    }
  })
})
