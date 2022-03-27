'use strict'

const {describe, it, before, beforeEach} = require('mocha')
const {expect} = require('chai')
const {loadFixtureBuffer} = require('../util/loadFixture')
const makeRenderingGridClient = require('../../src/sdk/renderingGridClient')
const testLogger = require('../util/testLogger')

describe('UFG native', () => {
  let openEyes
  const apiKey = process.env.APPLITOOLS_API_KEY // TODO bad for tests. what to do

  beforeEach(() => {
    openEyes = makeRenderingGridClient({
      showLogs: process.env.APPLITOOLS_SHOW_LOGS,
      apiKey,
      fetchResourceTimeout: 2000,
      logger: testLogger,
    }).openEyes
  })

  before(async () => {
    if (!apiKey) {
      throw new Error('APPLITOOLS_API_KEY env variable is not defined')
    }
  })

  it('renders VHS correctly on Android', async () => {
    const {checkWindow, close} = await openEyes({
      appName: 'core app',
      testName: 'native ufg android',
      browser: [{androidDeviceInfo: {name: 'Pixel 4 XL', version: 'latest'}}],
      saveNewTests: false,
    })

    checkWindow({
      isNativeUFG: true,
      snapshot: {
        platformName: 'android',
        vhsType: 'android-x',
        vhsHash: {
          hashFormat: 'sha256',
          hash: '4133a99761eb801fea6f6e73d3b3d008abbee96e4d16be48e21a0ff211016a30',
          contentType: `x-applitools-vhs/android-x`,
        },
      },
    })

    const results = await close(false)
    expect(results.length).to.eq(1)
    expect(results[0].getStatus()).to.equal('Passed')
  })

  it.only('renders VHS correctly on iOS', async () => {
    const {checkWindow, close} = await openEyes({
      appName: 'core app',
      testName: 'native ufg ios',
      browser: [{iosDeviceInfo: {name: 'iPhone 12', version: 'latest'}}],
      saveNewTests: false,
    })

    checkWindow({
      isNativeUFG: true,
      snapshot: {
        platformName: 'ios',
        resourceContents: {
          vhs: {
            value: loadFixtureBuffer('vhs-ios'),
            type: 'x-applitools-vhs/ios',
          },
        },
        vhsCompatibilityParams: {
          UIKitLinkTimeVersionNumber: 5522,
          UIKitRunTimeVersionNumber: 5205,
        },
      },
    })

    const results = await close(false)
    expect(results.length).to.eq(1)
    expect(results[0].getStatus()).to.equal('Passed')
  })
})
