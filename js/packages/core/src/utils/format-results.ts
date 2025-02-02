import type {TestResult} from '@applitools/core-base'

const OK = 'ok'
const NOT_OK = 'not ok'

export function toFormatterString(
  results: TestResult[],
  {includeSubTests = true, markNewAsPassed = false}: {includeSubTests?: boolean; markNewAsPassed?: boolean} = {},
) {
  if (results.length === 0) {
    return 'No results found.'
  }

  let formattedString = '[EYES: TEST RESULTS]:\n'

  for (let i = 0; i < results.length; i += 1) {
    /** @type {TestResults} */ const currentResult = results[i]

    const testTitle = `${currentResult.name} [${currentResult.hostDisplaySize.width}x${currentResult.hostDisplaySize.height}]`
    let testResult = ''

    if (currentResult.isNew) {
      testResult = markNewAsPassed ? 'Passed' : 'New'
    } else if (!currentResult.isDifferent) {
      testResult = 'Passed'
    } else {
      const stepsFailed = currentResult.mismatches + currentResult.missing
      testResult = `Failed ${stepsFailed} of ${currentResult.steps}`
    }

    formattedString += `${testTitle} - ${testResult}\n`

    if (includeSubTests) {
      if (currentResult.stepsInfo.length > 0) {
        for (let j = 0; j < currentResult.stepsInfo.length; j += 1) {
          const currentStep = currentResult.stepsInfo[j]

          const subTestTitle = currentStep.name
          const subTestResult = currentStep.isDifferent ? 'Passed' : 'Failed'
          formattedString += `\t> ${subTestTitle} - ${subTestResult}\n`
        }
      } else {
        formattedString += '\tNo steps exist for this test.\n'
      }
    }
  }

  formattedString += `See details at ${results[0].appUrls.batch}`

  return formattedString
}

export function toHierarchicTAPString(
  results: TestResult[],
  {includeSubTests = true, markNewAsPassed = false}: {includeSubTests?: boolean; markNewAsPassed?: boolean} = {},
) {
  if (results.length === 0) {
    return ''
  }

  let tapString = `1..${results.length}\n`

  for (let i = 0; i < results.length; i += 1) {
    /** @type {TestResults} */ const currentResult = results[i]
    const tapIndex = i + 1

    if (i > 0) {
      tapString += '#\n'
    }

    const name = `Test: '${currentResult.name}', Application: '${currentResult.appName}'`

    if (!currentResult.isDifferent) {
      tapString += `${OK} ${tapIndex} - [PASSED TEST] ${name}\n`
    } else if (currentResult.isNew) {
      // Test did not pass (might also be a new test).
      // New test
      const newResult = markNewAsPassed ? OK : NOT_OK
      tapString += `${newResult} ${tapIndex} - [NEW TEST] ${name}\n`
    } else {
      // Failed / Aborted test.
      tapString += `${NOT_OK} ${tapIndex} - `
      if (currentResult.isAborted) {
        tapString += `[ABORTED TEST] ${name}\n`
      } else {
        tapString += `[FAILED TEST] ${name}\n`
      }
      tapString += `#\tMismatches: ${currentResult.mismatches}\n`
    }

    const url =
      currentResult.appUrls && currentResult.appUrls.session ? currentResult.appUrls.session : "No URL (session didn't start)."
    tapString += `#\tTest url: ${url}\n`
    tapString += `#\tBrowser: ${currentResult.hostApp}, Viewport: ${currentResult.hostDisplaySize}\n`

    if (includeSubTests) {
      if (currentResult.stepsInfo.length > 0) {
        tapString += `\t1..${currentResult.stepsInfo.length}\n`
        for (let j = 0; j < currentResult.stepsInfo.length; j += 1) {
          const currentStep = currentResult.stepsInfo[j]
          tapString += '\t'
          tapString += currentStep.isDifferent ? NOT_OK : OK
          tapString += ` '${currentStep.name}', URL: ${currentStep.appUrls.step}\n`
        }
      } else {
        tapString += '\tNo steps exist for this test.\n'
      }
    }
  }

  return tapString
}

export function toFlattenedTAPString(results: TestResult[], {markNewAsPassed = false}: {markNewAsPassed?: boolean} = {}) {
  let tapString = ''
  let stepsCounter = 0

  // We'll add the TAP plan at the beginning, after we calculate the total number of steps.
  for (let i = 0; i < results.length; i += 1) {
    tapString += '#\n'

    /** @type {TestResults} */ const currentResult = results[i]
    const tapIndex = i + 1

    const name = `Test: '${currentResult.name}', Application: '${currentResult.appName}'`

    if (!currentResult.isDifferent) {
      tapString += `# ${OK} ${tapIndex} - [PASSED TEST] ${name}\n`
    } else if (currentResult.isNew) {
      // Test did not pass (might also be a new test).
      // New test
      const newResult = markNewAsPassed ? OK : NOT_OK
      tapString += `# ${newResult} ${tapIndex} - [NEW TEST] ${name}\n`
    } else {
      // Failed / Aborted test.
      tapString += `# ${NOT_OK} ${tapIndex} - `
      if (currentResult.isAborted) {
        tapString += `[ABORTED TEST] ${name}\n`
      } else {
        tapString += `[FAILED TEST] ${name}\n`
      }
      tapString += `#\tMismatches: ${currentResult.mismatches}\n`
    }

    const url =
      currentResult.appUrls && currentResult.appUrls.session ? currentResult.appUrls.session : "No URL (session didn't start)."

    tapString += `#\tTest url: ${url}\n`
    if (currentResult.stepsInfo.length > 0) {
      for (let j = 0; j < currentResult.stepsInfo.length; j += 1) {
        stepsCounter += 1
        const currentStep = currentResult.stepsInfo[j]
        tapString += currentStep.isDifferent ? NOT_OK : OK
        tapString += ` ${stepsCounter} '${currentStep.name}', URL: ${currentStep.appUrls.step}\n`
      }
    } else {
      tapString += '#\tNo steps exist for this test.\n'
    }
  }

  if (stepsCounter > 0) {
    tapString = `1..${stepsCounter}\n${tapString}`
  }

  return tapString
}

export function toXmlOutput(results: TestResult[], {totalTime}: {totalTime?: number} = {}) {
  const suiteName = 'Eyes Test Suite'
  let output = `<?xml version="1.0" encoding="UTF-8" ?>`
  output += `\n<testsuite name="${suiteName}" tests="${results.length}" time="${totalTime}">`
  results.forEach(result => {
    output += `\n<testcase name="${result.name}"${result.duration ? ` time="${result.duration}"` : ''}>`
    const properties = {} as any
    if (result.hostOS) properties.hostOS = result.hostOS
    if (result.hostApp) properties.hostApp = result.hostApp
    if (result.hostDisplaySize) properties.viewportSize = `${result.hostDisplaySize.width}x${result.hostDisplaySize.height}`

    if (properties.hostOS || properties.hostApp || properties.viewportSize) {
      output += `\n<properties>`
      for (const [name, value] of Object.entries(properties)) {
        output += `\n<property name="${name}" value="${value}"/>`
      }
      output += `\n</properties>`
    }
    if (result.isDifferent) {
      output += `\n<failure>`
      output += `\nDifference found. See ${result.appUrls.batch} for details.`
      output += `\n</failure>`
    } else if (result.isAborted) {
      output += `\n<failure>`
      output += `\nTest aborted.`
      output += `\n</failure>`
    }
    output += `\n</testcase>`
  })
  output += `\n</testsuite>`
  return output
}

export function toJsonOutput(results, space) {
  return JSON.stringify(results, null, space)
}
