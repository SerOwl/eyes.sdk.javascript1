const assert = require('assert')
const {makeCoverageTests, makeRun} = require('../../src/coverage-tests/index')

const fakeSDK = {
  open: () => {},
  check: () => {},
  close: () => {},
}

describe('coverage-tests', () => {
  describe('makeCoverageTests', () => {
    it('should return a collection of tests for an implemented SDK', () => {
      const tests = makeCoverageTests(fakeSDK)
      assert.ok(Object.keys(tests).length)
    })
  })

  describe('makeRun', () => {
    it('should return a run function', () => {
      const {run} = makeRun()
      assert.deepStrictEqual(typeof run, 'function')
    })
    it('should run tests with the provided implementation', async () => {
      let count = 0
      const name = 'blah'
      const initialize = () => {
        return {
          visit: () => {},
          open: () => {},
          check: () => {},
          close: () => {},
          cleanup: () => {
            count++
          },
        }
      }
      const supportedTests = [
        {name: 'checkRegionClassic', executionMode: {blah: true}},
        {name: 'checkRegionClassic', executionMode: {blahblah: true}},
      ]
      const {run} = makeRun(name, initialize)
      await run(supportedTests, () => {})
      assert.deepStrictEqual(count, 2)
    })
    it('should record and display errors from a run', async () => {
      const name = 'blah'
      const initialize = () => {
        return {
          visit: () => {},
          open: () => {
            throw 'blah error'
          },
          check: () => {},
          close: () => {},
          cleanup: () => {},
        }
      }
      const supportedTests = [{name: 'checkRegionClassic', executionMode: {blah: true}}]
      const {run} = makeRun(name, initialize)
      const output = []
      const log = msg => {
        output.push(msg)
      }
      await run(supportedTests, log)
      const expectedOutput = [
        'Coverage Tests are running for blah...',
        '-------------------- ERRORS --------------------',
        {'checkRegionClassic with blah': ['blah error']},
        '-------------------- SUMMARY --------------------',
        'Ran 1 tests in 0ms',
        'Encountered n errors in 1 tests',
      ]
      assert.deepStrictEqual(output[1], expectedOutput[1])
      assert.deepStrictEqual(output[2], expectedOutput[2])
      assert.deepStrictEqual(output[5], expectedOutput[5])
    })
  })
})
