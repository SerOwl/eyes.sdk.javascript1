const {makeDriver, sleep, test, logger} = require('../e2e')

describe.skip('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full webview screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Web view'})
    await button.click()
    await driver.target.getContexts()
    await sleep(500)
    const [, webview] = await driver.target.getContexts()
    await driver.target.switchContext(webview)
    await driver.init()

    await test({
      type: 'ios',
      tag: 'webview-fully',
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})
