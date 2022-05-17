const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter ios web', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', app: 'safari', orientation: 'landscape', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take viewport screenshot with landscape orientation', async () => {
    await driver.visit('https://applitools.github.io/demo/TestPages/PageWithBurgerMenu/')
    await sleep(5000)

    await test({
      type: 'ios-web',
      tag: 'page-landscape',
      driver,
      logger,
    })
  })
})
