const assert = require('assert')
const spec = require('../../src/SpecDriver')
const {Selector} = require('testcafe')

fixture`SpecDriver`.page`https://applitools.github.io/demo/TestPages/FramesTestPage/`

test('isDriver(driver)', driver => {
  assert.strictEqual(spec.isDriver(driver), true)
})
test('isDriver(wrong)', _driver => {
  assert.strictEqual(spec.isDriver({}), false)
})
test('isElement(Selector)', async _driver => {
  const element = await Selector('div')()
  assert.strictEqual(spec.isElement(element), true)
})
test('isElement(wrong)', _driver => {
  assert.strictEqual(spec.isElement({}), false)
})
test('isSelector(string)', _driver => {
  assert.strictEqual(spec.isSelector('//div'), true)
})
test('isSelector(Selector)', _driver => {
  assert.strictEqual(spec.isSelector(Selector('//div')), true)
})
test('isSelector(wrong)', _driver => {
  assert.strictEqual(spec.isSelector({}), false)
})
test('findElement(string)', async driver => {
  const selector = await spec.findElement(driver, '#overflowing-div')
  assert.strictEqual(spec.isSelector(selector), true)
})
test('findElement(Selector)', async driver => {
  const selector = await spec.findElement(driver, Selector('#overflowing-div'))
  assert.strictEqual(spec.isSelector(selector), true)
})
test('findElement(DOM Node snapshot)', async driver => {
  const elSnapshot = await Selector('#overflowing-div')
  const selector = await spec.findElement(driver, elSnapshot)
  assert.strictEqual(spec.isSelector(selector), true)
})
test('findElement(non-existent)', async driver => {
  const selector = await spec.findElement(driver, 'non-existent')
  assert.strictEqual(spec.isSelector(selector), false)
})
test('findElements(string)', async driver => {
  const elements = await spec.findElements(driver, 'div')
  assert.deepStrictEqual(!!elements.length, true)
})
test('findElements(Selector)', async driver => {
  const elements = await spec.findElements(driver, Selector('div'))
  assert.deepStrictEqual(!!elements.length, true)
})
test('findElements(DOM Node snapshot)', async driver => {
  const elSnapshot = await Selector('div')()
  const elements = await spec.findElements(driver, elSnapshot)
  assert.deepStrictEqual(!!elements.length, true)
})
test('findElements(non-existent)', async driver => {
  const elements = await spec.findElements(driver, 'non-existent')
  assert.deepStrictEqual(!!elements.length, false)
})
test('isEqualElements(element, element)', async driver => {
  const element1 = await Selector('h1')()
  const element2 = await Selector('h1')()
  assert.deepStrictEqual(spec.isEqualElements(driver, element1, element2), true)
})
test('isEqualElements(element1, element2)', async driver => {
  const element1 = await Selector('div')()
  const element2 = await Selector('h1')()
  assert.deepStrictEqual(spec.isEqualElements(driver, element1, element2), false)
})
test('executeScript(string)', async driver => {
  assert.deepStrictEqual(await spec.executeScript(driver, 'return 4'), 4)
})
test('executeScript(string, ...args)', async driver => {
  assert.deepStrictEqual(
    await spec.executeScript(driver, 'return arguments[0] + arguments[1]', 4, 5),
    9,
  )
})
test('executeScript(function, ...args)', async driver => {
  const script = function() {
    return arguments[0] + arguments[1]
  }
  assert.deepStrictEqual(await spec.executeScript(driver, script, 4, 5), 9)
})
test('executeScript w/ Selector', async driver => {
  const script = "return getComputedStyle(arguments[0]).getPropertyValue('overflow')"
  assert.deepStrictEqual(await spec.executeScript(driver, script, Selector('html')), 'visible')
})
test('executeScript w/ DOM Node Snapshot', async driver => {
  const elSnapshot = await Selector('html')()
  const script = "return arguments[0].style['overflow-y']"
  assert.deepStrictEqual(await spec.executeScript(driver, script, elSnapshot), 'visible')
})
test('executeScript re-use returned element', async driver => {
  const expected = await Selector('h1')()
  const result = await spec.executeScript(driver, 'return arguments[0]', Selector('h1'))
  const actual = await spec.executeScript(driver, 'return arguments[0]', Selector(result))
  assert.deepStrictEqual(actual.innerText, expected.innerText)
})
test('executeScript re-use returned element (when the element changes)', async driver => {
  const expected = 'blah'
  const result = await spec.executeScript(driver, 'return arguments[0]', Selector('h1'))
  await spec.executeScript(driver, `document.querySelector('h1').textContent = '${expected}'`)
  const actual = await spec.executeScript(driver, 'return arguments[0]', result.selector)
  assert.deepStrictEqual(actual.innerText, expected)
})
test('executeScript return mixed data-types (Array)', async driver => {
  const expected = 2
  const result = await spec.executeScript(driver, 'return [0, arguments[0]]', Selector('h1'))
  const actual = result.length
  assert.deepStrictEqual(actual, expected)
})
test('executeScript return mixed data-types (Object)', async driver => {
  const expected = 2
  const result = await spec.executeScript(
    driver,
    "return {element: arguments[0], blah: 'blah'}",
    Selector('h1'),
  )
  const actual = Object.entries(result).length
  assert.deepStrictEqual(actual, expected)
})
test('mainContext()', async driver => {
  try {
    const mainDocument = await Selector('html')()
    await driver.switchToIframe('[name="frame1"]')
    await driver.switchToIframe('[name="frame1-1"]')
    const frameDocument = await Selector('html')()
    assert.ok(!spec.isEqualElements(driver, mainDocument, frameDocument))
    await spec.mainContext(driver)
    const resultDocument = await Selector('html')()
    assert.ok(spec.isEqualElements(driver, resultDocument, mainDocument))
  } finally {
    await driver.switchToMainWindow().catch(() => null)
  }
})
test('getTitle()', async driver => {
  //const expected = 'Hello World'
  //await spec.visit(driver, 'data:text/html,<title>Hello%20World</title><body>blah</body>')
  const expected = 'Cross SDK test'
  const actual = await spec.getTitle(driver)
  assert.deepStrictEqual(actual, expected)
})
test('getUrl()', async driver => {
  const expected = 'https://applitools.github.io/demo/TestPages/FramesTestPage/'
  const result = await spec.getUrl(driver)
  assert.deepStrictEqual(result, expected)
})
test('visit()', async driver => {
  let startUrl
  try {
    startUrl = await spec.getUrl(driver)
    const blank = 'about:blank'
    await spec.visit(driver, blank)
    const actual = await spec.getUrl()
    assert.deepStrictEqual(actual, blank)
  } finally {
    await spec.visit(driver, startUrl)
  }
})
test.skip('takeScreenshot', _driver => {})
test.skip('getElementRect', _driver => {})
test.skip('getWindowRect', _driver => {})
test.skip('setWindowRect', _driver => {})
test.skip('parentContext()', _driver => {})
test.skip('childContext(element)', _driver => {})
test.skip('build', _driver => {})
test.skip('cleanup', _driver => {})
