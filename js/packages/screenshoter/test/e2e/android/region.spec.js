const {makeDriver, test, logger} = require('../e2e')

describe('screenshoter android app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take region screenshot', async () => {
    await test({
      type: 'android',
      tag: 'region',
      region: {x: 30, y: 500, height: 100, width: 200},
      scrollingMode: 'scroll',
      driver,
      logger,
    })
  })
})
