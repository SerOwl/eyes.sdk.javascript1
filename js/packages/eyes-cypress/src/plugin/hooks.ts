import handleTestResults from './handleTestResults'

export default function makeGlobalRunHooks({closeManager, closeBatches, closeUniversalServer}: any) {
  return {
    'before:run': ({config}: any) => {
      if (!config.isTextTerminal) return
    },

    'after:run': async ({config}: any) => {
      try {
        if (!config.isTextTerminal) return
        const summaries = await closeManager()

        let testResults
        for (const summary of summaries) {
          testResults = summary.results.map(({testResults}: any) => testResults)
        }
        if (!config.appliConfFile.dontCloseBatches) {
          await closeBatches({
            batchIds: [config.appliConfFile.batchId || config.appliConfFile.batch.id],
            serverUrl: config.appliConfFile.serverUrl,
            proxy: config.appliConfFile.proxy,
            apiKey: config.appliConfFile.apiKey,
          })
        }

        if (config.appliConfFile.tapDirPath) {
          await handleTestResults.handleBatchResultsFile(testResults, {
            tapDirPath: config.appliConfFile.tapDirPath,
            tapFileName: config.appliConfFile.tapFileName,
          })
        }
      } finally {
        await closeUniversalServer()
      }
    },
  }
}
