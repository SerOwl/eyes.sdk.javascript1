'use strict';
const handleTestResults = require('./handleTestResults');

function makeGlobalRunHooks({closeManager, closeBatches, closeUniversalServer}) {
  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': async ({config}) => {
      try {
        if (!config.isTextTerminal) return;
        const resultConfig = {
          showLogs: config.showLogs,
          eyesFailCypressOnDiff: config.eyesFailCypressOnDiff,
          isTextTerminal: config.isTextTerminal,
        };
        const summaries = await closeManager();

        let testResults;
        for (const summary of summaries) {
          testResults = summary.results.map(({testResults}) => testResults);
        }
        if (!config.appliConfFile.dontCloseBatches) {
          await closeBatches({
            batchIds: [config.appliConfFile.batchId || config.appliConfFile.batch.id],
            serverUrl: config.appliConfFile.serverUrl,
            proxy: config.appliConfFile.proxy,
            apiKey: config.appliConfFile.apiKey,
          });
        }

        if (config.appliConfFile.tapDirPath) {
          await handleTestResults.handleBatchResultsFile(testResults, {
            tapDirPath: config.appliConfFile.tapDirPath,
            tapFileName: config.appliConfFile.tapFileName,
          });
        }

        handleTestResults.printTestResults({testResults, resultConfig});
      } finally {
        await closeUniversalServer();
      }
    },
  };
}

module.exports = makeGlobalRunHooks;
