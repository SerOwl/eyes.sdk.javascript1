const core = require('@applitools/eyes-sdk-core')
const {EyesClassic, EyesVisualGrid, EyesFactory, CheckSettings} = require('./src/sdk')
const {LegacySelector} = require('./src/legacy-api')

exports.Eyes = EyesFactory
exports.EyesWDIO = EyesClassic
exports.EyesVisualGrid = EyesVisualGrid
exports.Target = CheckSettings
exports.WebdriverioCheckSettings = CheckSettings

exports.By = LegacySelector
exports.EyesScreenshot = core.EyesScreenshotNew
exports.StitchMode = core.StitchMode
exports.Logger = core.Logger
exports.ClassicRunner = core.ClassicRunner
exports.VisualGridRunner = core.VisualGridRunner
exports.Configuration = core.Configuration
exports.ConsoleLogHandler = core.ConsoleLogHandler
exports.FileLogHandler = core.FileLogHandler
exports.BatchInfo = core.BatchInfo
exports.BrowserType = core.BrowserType
exports.DeviceName = core.DeviceName
exports.ScreenOrientation = core.ScreenOrientation
exports.IosDeviceName = core.IosDeviceName
exports.Region = core.Region
exports.MatchLevel = core.MatchLevel
exports.RectangleSize = core.RectangleSize
exports.AccessibilityLevel = core.AccessibilityLevel
exports.AccessibilityRegionType = core.AccessibilityRegionType
exports.AccessibilityMatchSettings = core.AccessibilityMatchSettings
exports.AccessibilityGuidelinesVersion = core.AccessibilityGuidelinesVersion
exports.AccessibilityRegionBySelector = core.AccessibilityRegionBySelector
exports.AccessibilityRegionByElement = core.AccessibilityRegionByElement
exports.ProxySettings = core.ProxySettings
