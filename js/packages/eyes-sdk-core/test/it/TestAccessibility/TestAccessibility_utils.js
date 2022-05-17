'use strict'

const assert = require('assert')
const axios = require('axios')
const {AccessibilityLevel, AccessibilityGuidelinesVersion, VisualGridRunner, ClassicRunner} = require('../../../index')
const {EyesFactory} = require('../../utils/FakeSDK')

async function runTest(driver, useVisualGrid) {
  const accessibilitySettings = {
    level: AccessibilityLevel.AA,
    guidelinesVersion: AccessibilityGuidelinesVersion.WCAG_2_0,
  }

  const runner = useVisualGrid ? new VisualGridRunner(10) : new ClassicRunner()
  const eyes = new EyesFactory(runner)
  eyes.setConfiguration({
    matchTimeout: 0,
    defaultMatchSettings: {
      accessibilitySettings,
    },
  })

  await eyes.open(driver, 'SessionStartInfo', `TestAccessibility${useVisualGrid ? '_VG' : ''}`, {
    width: 700,
    height: 460,
  })

  const checkSettings = {
    accessibilityRegions: [
      {region: {x: 10, y: 20, width: 30, height: 40}, type: 'LargeText'},
      {region: 'element2', type: 'IgnoreContrast'},
    ],
  }

  await eyes.check(checkSettings)
  const [testResults] = await eyes.close()

  const sessionAccessibilityStatus = testResults.accessibilityStatus

  assert.ok(sessionAccessibilityStatus)
  assert.ok(sessionAccessibilityStatus.status)
  assert.strictEqual(sessionAccessibilityStatus.version, accessibilitySettings.guidelinesVersion)
  assert.strictEqual(sessionAccessibilityStatus.level, accessibilitySettings.level)

  const sessionResults = await getApiData(testResults)
  const {startInfo, actualAppOutput} = sessionResults

  const expectedAccessibilityRegions = [
    {type: 'LargeText', isDisabled: false, left: 10, top: 20, width: 30, height: 40},
    {type: 'IgnoreContrast', isDisabled: false, left: 20, top: 21, width: 201, height: 202},
    {type: 'IgnoreContrast', isDisabled: false, left: 30, top: 31, width: 301, height: 302},
  ]
  const expectedAccessibilitySettings = {
    level: 'AA',
    version: 'WCAG_2_0',
  }

  assert.deepStrictEqual(startInfo.defaultMatchSettings.accessibilitySettings, expectedAccessibilitySettings)

  assert.deepStrictEqual(actualAppOutput[0].imageMatchSettings.accessibility, expectedAccessibilityRegions)

  // reset value
  eyes.setConfiguration(eyes.getConfiguration().setAccessibilityValidation())

  await eyes.open(driver, 'SessionStartInfo', `TestAccessibility_No_Accessibility${useVisualGrid ? '_VG' : ''}`)
  await eyes.check()
  const [testResultsWithoutAccessibility] = await eyes.close()

  assert.deepStrictEqual(testResultsWithoutAccessibility.accessibilityStatus, undefined)

  const {startInfo: startInfoWithoutAccessibility} = await getApiData(testResultsWithoutAccessibility)

  assert.strictEqual(startInfoWithoutAccessibility.defaultMatchSettings.accessibilitySettings, undefined)
}

async function getApiData(testResults, apiKey = process.env.APPLITOOLS_API_KEY) {
  const url = `${testResults.apiUrls.session}?format=json&AccessToken=${testResults.secretToken}&apiKey=${apiKey}`

  let response = await axios.get(url)
  return response.data
}

module.exports = {
  runTest,
}
