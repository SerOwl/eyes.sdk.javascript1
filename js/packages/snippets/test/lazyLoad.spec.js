const assert = require('assert')
const {lazyLoad} = require('../dist/index')

describe('lazyLoad', () => {
  const pages = {
    snippetsTestPage: 'https://applitools.github.io/demo/TestPages/SnippetsTestPage/',
    snippetsTestPageInsideScrollableArea:
      'https://applitools.github.io/demo/TestPages/LazyLoad/insideScrollableArea.html',
    cannotScroll: 'data:text/html,%3Ch1%3EHello%2C%20World%21%3C%2Fh1%3E',
    infiniteScroll: 'https://applitools.github.io/demo/TestPages/InfiniteScroll/',
  }
  const options = {
    scrollLength: 300,
    waitingTime: 1,
    maxAmountToScroll: 15000,
  }
  const startingPosition = {x: 10, y: 50}

  describe('chrome', () => {
    let page

    before(async function() {
      page = await global.getDriver('chrome')
      if (!page) {
        this.skip()
      }
    })

    it('works on a page that can scroll', async () => {
      await page.goto(pages.snippetsTestPage)
      await page.evaluate(`window.scrollTo(${startingPosition.x}, ${startingPosition.y})`)
      const scrollableHeight = await page.evaluate(
        () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
      )
      await page.evaluate(lazyLoad, [null, options])
      let result
      do {
        result = JSON.parse(await page.evaluate(lazyLoad))
      } while (result.status && result.status === 'WIP')
      const transactionHistory = result.value
      const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
      const resetScroll = transactionHistory[transactionHistory.length - 1]
      assert.deepStrictEqual(scrolledHeight, scrollableHeight)
      assert.deepStrictEqual(resetScroll.x, startingPosition.x)
      assert.deepStrictEqual(resetScroll.y, startingPosition.y)
    })

    it('works on a page that cannot scroll', async () => {
      await page.goto(pages.cannotScroll)
      await page.evaluate(lazyLoad, [null, options])
      let result
      do {
        result = JSON.parse(await page.evaluate(lazyLoad))
      } while (result.status && result.status === 'WIP')
      const transactionHistory = result.value
      const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
      const resetScroll = transactionHistory[transactionHistory.length - 1]
      assert.deepStrictEqual(scrolledHeight, 0)
      assert.deepStrictEqual(resetScroll.x, 0)
      assert.deepStrictEqual(resetScroll.y, 0)
    })

    it('works on a page with infinite scroll', async () => {
      await page.goto(pages.infiniteScroll)
      await page.evaluate(lazyLoad, [null, options])
      let result
      do {
        result = JSON.parse(await page.evaluate(lazyLoad))
      } while (result.status && result.status === 'WIP')
      const transactionHistory = result.value
      const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
      const resetScroll = transactionHistory[transactionHistory.length - 1]
      assert.deepStrictEqual(scrolledHeight, options.maxAmountToScroll)
      assert.deepStrictEqual(resetScroll.x, 0)
      assert.deepStrictEqual(resetScroll.y, 0)
    })

    it('works on a page with a custom scrolling element', async () => {
      await page.goto(pages.snippetsTestPageInsideScrollableArea)
      await page.evaluate(
        `document.querySelector('#sre').scrollTo(${startingPosition.x}, ${startingPosition.y})`,
      )
      const scrollableHeight = await page.evaluate(
        () =>
          document.querySelector('#sre').scrollHeight - document.querySelector('#sre').clientHeight,
      )
      const sre = await page.$('#sre')
      await page.evaluate(lazyLoad, [sre, options])
      let result
      do {
        result = JSON.parse(await page.evaluate(lazyLoad))
      } while (result.status && result.status === 'WIP')
      const transactionHistory = result.value
      const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
      const resetScroll = transactionHistory[transactionHistory.length - 1]
      assert.deepStrictEqual(scrolledHeight, scrollableHeight)
      assert.deepStrictEqual(resetScroll.x, 0)
      assert.deepStrictEqual(resetScroll.y, 0)
    })
  })

  for (const name of ['internet explorer', 'ios safari']) {
    describe(name, () => {
      let driver
      before(async function() {
        driver = await global.getDriver(name)
        if (!driver) {
          this.skip()
        }
      })

      it('works on a page that can scroll', async () => {
        await driver.url(pages.snippetsTestPage)
        await driver.execute(`window.scrollTo(${startingPosition.x}, ${startingPosition.y})`)
        const scrollableHeight = await driver.execute(function() {
          return document.documentElement.scrollHeight - document.documentElement.clientHeight
        })
        await driver.execute(lazyLoad, [null, options])
        let result
        do {
          result = JSON.parse(await driver.execute(lazyLoad))
        } while (result.status && result.status === 'WIP')
        const transactionHistory = result.value
        const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
        const resetScroll = transactionHistory[transactionHistory.length - 1]
        assert(scrollableHeight - options.scrollLength <= scrolledHeight <= scrollableHeight)
        assert.deepStrictEqual(resetScroll.x, startingPosition.x)
        assert.deepStrictEqual(resetScroll.y, startingPosition.y)
      })

      it('works on a page that cannot scroll', async function() {
        // In new Safari (observed in 15.5 at least) a page that doesn't scroll still have
        // a (small) scroll effect so the snippet thinks it can keep scrolling, and tries until
        // exhaustion. This should be fixed, but it's not a breaking issue. Just a matter of
        // performance. Skipping for now.
        if (name === 'ios safari') this.skip()
        await driver.url(pages.cannotScroll)
        await driver.execute(lazyLoad, [null, options])
        let result
        do {
          result = JSON.parse(await driver.execute(lazyLoad))
        } while (result.status && result.status === 'WIP')
        const transactionHistory = result.value
        const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
        const resetScroll = transactionHistory[transactionHistory.length - 1]
        assert.deepStrictEqual(scrolledHeight, 0)
        assert.deepStrictEqual(resetScroll.x, 0)
        assert.deepStrictEqual(resetScroll.y, 0)
      })

      it('works on a page with infinite scroll', async () => {
        await driver.url(pages.infiniteScroll)
        await driver.execute(lazyLoad, [null, options])
        let result
        do {
          result = JSON.parse(await driver.execute(lazyLoad))
        } while (result.status && result.status === 'WIP')
        const transactionHistory = result.value
        const scrolledHeight = transactionHistory[transactionHistory.length - 2].y
        const resetScroll = transactionHistory[transactionHistory.length - 1]
        assert.deepStrictEqual(scrolledHeight, options.maxAmountToScroll)
        assert.deepStrictEqual(resetScroll.x, 0)
        assert.deepStrictEqual(resetScroll.y, 0)
      })
    })
  }
})
