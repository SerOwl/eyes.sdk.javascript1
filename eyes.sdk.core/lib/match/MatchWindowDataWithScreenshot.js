'use strict';

const GeneralUtils = require('../utils/GeneralUtils');

/**
 * A container for a MatchWindowData along with the screenshot used for creating it. (We specifically avoid inheritance
 * so we don't have to deal with serialization issues).
 */
class MatchWindowDataWithScreenshot {
  /**
   * @param {MatchWindowData} matchWindowData
   * @param {EyesScreenshot} screenshot
   */
  constructor(matchWindowData, screenshot) {
    this._matchWindowData = matchWindowData;
    this._screenshot = screenshot;
  }

  // noinspection JSUnusedGlobalSymbols
  /** @return {MatchWindowData} */
  getMatchWindowData() {
    return this._matchWindowData;
  }

  // noinspection JSUnusedGlobalSymbols
  /** @return {EyesScreenshot} */
  getScreenshot() {
    return this._screenshot;
  }

  /** @override */
  toJSON() {
    return GeneralUtils.toPlain(this);
  }

  /** @override */
  toString() {
    return `MatchWindowDataWithScreenshot { ${JSON.stringify(this)} }`;
  }
}

module.exports = MatchWindowDataWithScreenshot;
