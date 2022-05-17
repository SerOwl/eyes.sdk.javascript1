const path = require('path');

module.exports = {
  appName: 'faking IE',
  batchName: 'Fake IE story',
  storybookConfigDir: path.resolve(__dirname, '../../fixtures/fakeIE'),
  storybookStaticDir: path.resolve(__dirname, '../../fixtures'),
  fakeIE: true,
  browser: [
    {width: 800, height: 600, name: 'ie11'},
    {width: 800, height: 600, name: 'chrome'},
  ],
};
