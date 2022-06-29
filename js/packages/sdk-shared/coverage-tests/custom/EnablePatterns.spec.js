// https://trello.com/c/QCK2xDlS
const {setupEyes, getTestInfo} = require('@applitools/test-utils')
const assert = require('assert')
const path = require('path')
const cwd = process.cwd()
const spec = require(path.resolve(cwd, 'dist/spec-driver'))

describe('EnablePatterns', () => {
  let driver, destroyDriver
  before(async () => {
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
  })
  after(async () => {
    await destroyDriver()
  })
  it('in config (classic)', async () => {
    await spec.visit(driver, 'https://applitools.com/helloworld/')
    const eyes = setupEyes({vg: false})
    const config = eyes.getConfiguration()
    config.setEnablePatterns(true)
    eyes.setConfiguration(config)
    await eyes.open(driver, 'eyes-testcafe', 'enablePatterns')
    await eyes.checkWindow('asdf')
    const result = await eyes.close(false)
    const testInfo = await getTestInfo(result)
    assert.ok(testInfo['actualAppOutput']['0']['imageMatchSettings']['enablePatterns'])
  })
  it('in config (vg)', async () => {
    await spec.visit(driver, 'https://applitools.com/helloworld/')
    const eyes = setupEyes({vg: true})
    const config = eyes.getConfiguration()
    config.setEnablePatterns(true)
    eyes.setConfiguration(config)
    await eyes.open(driver, 'eyes-testcafe', 'enablePatterns')
    await eyes.checkWindow('asdf')
    const result = await eyes.close(false)
    const testInfo = await getTestInfo(result)
    assert.ok(testInfo['actualAppOutput']['0']['imageMatchSettings']['enablePatterns'])
  })
  it('in check settings (classic)', async () => {
    await spec.visit(driver, 'https://applitools.com/helloworld/')
    const eyes = setupEyes({vg: false})
    await eyes.open(driver, 'eyes-testcafe', 'enablePatterns')
    await eyes.check({enablePatterns: true})
    const result = await eyes.close(false)
    const testInfo = await getTestInfo(result)
    assert.ok(testInfo['actualAppOutput']['0']['imageMatchSettings']['enablePatterns'])
  })
  it('in check settings (vg)', async () => {
    await spec.visit(driver, 'https://applitools.com/helloworld/')
    const eyes = setupEyes({vg: true})
    await eyes.open(driver, 'eyes-testcafe', 'enablePatterns')
    await eyes.check({enablePatterns: true})
    const result = await eyes.close(false)
    const testInfo = await getTestInfo(result)
    assert.ok(testInfo['actualAppOutput']['0']['imageMatchSettings']['enablePatterns'])
  })
})