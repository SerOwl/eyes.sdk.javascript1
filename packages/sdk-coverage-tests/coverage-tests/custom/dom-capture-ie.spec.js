// re: https://trello.com/c/EQD3JUOf
const cwd = process.cwd()
const path = require('path')
const {getEyes} = require('../util/TestSetup')
const spec = require(path.resolve(cwd, 'src/SpecDriver'))
const {Target} = require(cwd)
const {assertImage} = require('../util/ApiAssertions')

describe('Coverage Tests', async () => {
  describe('edge (@edge18)', () => {
    let eyes
    let driver

    before(async () => {
      driver = await spec.build({browser: 'edge18', remote: 'sauce'})
      eyes = getEyes()
    })

    after(async () => {
      await spec.cleanup(driver)
      await eyes.abortIfNotClosed()
    })

    it('dom-capture-edge-classic', async function() {
      eyes.setMatchTimeout(0)
      await spec.visit(driver, 'http://applitools-dom-capture-origin-1.surge.sh/ie.html')
      await eyes.open(driver, this.test.parent.title, 'dom-capture-ie')
      await eyes.check(undefined, Target.window())
      const results = await eyes.close(false)
      await assertImage(results, {
        hasDom: true,
      })
    })
  })
  describe('ie (@ie11)', () => {
    let eyes
    let driver

    before(async () => {
      driver = await spec.build({browser: 'ie11', remote: 'sauce', legacy: true})
      eyes = getEyes()
    })

    after(async () => {
      await spec.cleanup(driver)
      await eyes.abortIfNotClosed()
    })

    it('dom-capture-ie-11', async function() {
      eyes.setMatchTimeout(0)
      await spec.visit(driver, 'http://applitools-dom-capture-origin-1.surge.sh/ie.html')
      await eyes.open(driver, this.test.parent.title, 'dom-capture-ie')
      await eyes.check(undefined, Target.window())
      const results = await eyes.close(false)
      await assertImage(results, {
        hasDom: true,
      })
    })
  })
})
