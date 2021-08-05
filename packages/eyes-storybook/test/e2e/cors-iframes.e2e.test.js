const {describe, it, _before, _after} = require('mocha');
const path = require('path');
const {testServerInProcess} = require('@applitools/test-server');
const {delay: _psetTimeout, presult} = require('@applitools/functional-commons');
const utils = require('@applitools/utils');
const snap = require('@applitools/snaptdout');
const {version} = require('../../package.json');

describe('eyes-storybook', () => {
  it('renders cross-origin iframes', async () => {
    let closeServerA, closeServerB;
    const staticPath = path.join(
      process.cwd(),
      'node_modules/@applitools/sdk-shared/coverage-tests/fixtures',
    );
    try {
      closeServerA = (
        await testServerInProcess({
          port: 7777,
          staticPath,
          allowCors: false,
          middlewareFile: path.resolve(
            process.cwd(),
            'node_modules/@applitools/sdk-shared/coverage-tests/util/handlebars-middleware.js',
          ),
          hbData: {
            src: 'http://localhost:7778/cors_frames/frame.html',
          },
        })
      ).close;
      closeServerB = (await testServerInProcess({port: 7778, staticPath})).close;
      const [err, result] = await presult(
        utils.process.sh(
          `node ${path.resolve(__dirname, '../../bin/eyes-storybook')} -f ${path.resolve(
            __dirname,
            'happy-config/cross-origin-iframe.config.js',
          )}`,
          {
            spawnOptions: {stdio: 'pipe'},
          },
        ),
      );
      const stdout = err ? err.stdout : result.stdout;
      const output = stdout
        .replace(/\[Chrome \d+.\d+\]/g, '[Chrome]')
        .replace(/\/.*.bin\/start-storybook/, '<story-book path>')
        .replace(
          /See details at https\:\/\/.+.applitools.com\/app\/test-results\/.+/g,
          'See details at <some_url>',
        )
        .replace(/Total time\: \d+ seconds/, 'Total time: <some_time> seconds')
        .replace(version, '<version>');
      console.log(output)
      await snap(output, 'cors');
    } finally {
      await closeServerA();
      await closeServerB();
    }
  });
});
