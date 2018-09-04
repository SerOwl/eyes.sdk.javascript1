'use strict';
const throatPkg = require('throat');
const getBatch = require('./getBatch');
const createLogger = require('./createLogger');
const makeGetAllResources = require('./getAllResources');
const makeExtractCssResources = require('./extractCssResources');
const makeFetchResource = require('./fetchResource');
const makeExtractCssResourcesFromCdt = require('./extractCssResourcesFromCdt');
const createResourceCache = require('./createResourceCache');
const makeGetBundledCssFromCdt = require('./getBundledCssFromCdt');
const makeWaitForRenderedStatus = require('./waitForRenderedStatus');
const makePutResources = require('./putResources');
const makeRenderBatch = require('./renderBatch');
const makeOpenEyes = require('./openEyes');
const makeWaitForTestResults = require('./waitForTestResults');
const makeOpenEyesLimitedConcurrency = require('./openEyesLimitedConcurrency');
const makeUploadResource = require('./uploadResource');
const EyesWrapper = require('./EyesWrapper');

function makeRenderingGridClient({
  getConfig,
  updateConfig,
  getInitialConfig,
  showLogs,
  renderStatusTimeout,
  renderStatusInterval,
  concurrency = Infinity,
  renderConcurrencyFactor = 5,
  wrapper,
}) {
  const openEyesConcurrency = Number(getConfig({concurrency}).concurrency);

  if (isNaN(openEyesConcurrency)) {
    throw new Error('concurrency is not a number');
  }

  const renderThroat = throatPkg(openEyesConcurrency * renderConcurrencyFactor);

  let error;
  const logger = createLogger(showLogs);
  const resourceCache = createResourceCache();
  const fetchCache = createResourceCache();
  const extractCssResources = makeExtractCssResources(logger);
  const fetchResource = makeFetchResource(logger);
  const extractCssResourcesFromCdt = makeExtractCssResourcesFromCdt(extractCssResources);
  const getBundledCssFromCdt = makeGetBundledCssFromCdt({resourceCache, logger});
  const putResources = makePutResources();
  const renderBatch = makeRenderBatch({putResources, resourceCache, fetchCache, logger});
  const uploadResource = makeUploadResource(logger);
  const waitForRenderedStatus = makeWaitForRenderedStatus({
    timeout: renderStatusTimeout,
    getStatusInterval: renderStatusInterval,
    logger,
  });
  const getAllResources = makeGetAllResources({
    resourceCache,
    extractCssResources,
    fetchResource,
    fetchCache,
  });

  wrapper =
    wrapper || new EyesWrapper({apiKey: getConfig().apiKey, logHandler: logger.getLogHandler()}); // TODO when organizing config, make this a default value in the function parameters

  const renderInfoPromise = wrapper
    .getRenderInfo()
    .then(renderInfo => {
      wrapper.setRenderingInfo(renderInfo);
      return renderInfo;
    })
    .catch(err => {
      if (err.response && err.response.status === 401) {
        setError(new Error('Unauthorized access to Eyes server. Please check your API key.'));
      } else {
        setError(err);
      }
    });

  const openEyes = makeOpenEyes({
    setError,
    getError,
    extractCssResourcesFromCdt,
    getBundledCssFromCdt,
    renderBatch,
    waitForRenderedStatus,
    getAllResources,
    renderThroat,
    renderInfoPromise,
    renderWrapper: wrapper,
    uploadResource,
  });
  const openEyesLimitedConcurrency = makeOpenEyesLimitedConcurrency(
    openEyesWithConfig,
    openEyesConcurrency,
  );
  const waitForTestResults = makeWaitForTestResults({logger, getError});

  const defaultBatch = getBatch(getInitialConfig());
  logger.log('new default batch', defaultBatch);
  updateConfig(defaultBatch);

  return {
    openEyes: openEyesLimitedConcurrency,
    waitForTestResults,
    getError,
  };

  function setError(err) {
    logger.log('error set', err);
    error = err;
  }

  function getError() {
    return error;
  }

  function openEyesWithConfig(args) {
    const config = getConfig(args);
    return openEyes(config);
  }
}

module.exports = makeRenderingGridClient;
