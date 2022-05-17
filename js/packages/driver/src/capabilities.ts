import type * as types from '@applitools/types'

type Capabilities = Record<string, any>

export function parseCapabilities(
  capabilities: Capabilities,
  customConfig?: types.CustomCapabilitiesConfig,
): types.DriverInfo {
  if (capabilities.capabilities) capabilities = capabilities.capabilities

  if (!customConfig?.keepPlatformNameAsIs) {
    // We use `startsWith` for just a theorerical reason. It's not based on any concrete case that we knew of at the time of writing this code.
    if (capabilities.platformName?.startsWith('android')) {
      capabilities.platformName = capabilities.platformName.charAt(0).toUpperCase() + capabilities.platformName.slice(1)
    }

    // We use `startsWith` for just a theorerical reason. It's not based on any concrete case that we knew of at the time of writing this code.
    if (capabilities.platformName?.startsWith('ios')) {
      capabilities.platformName = 'iOS' + capabilities.platformName.slice(3)
    }
  }

  const info: types.DriverInfo = {
    browserName:
      !capabilities.app && !capabilities.bundleId
        ? (capabilities.browserName ?? capabilities.desired?.browserName) || undefined
        : undefined,
    browserVersion: (capabilities.browserVersion ?? capabilities.version) || undefined,
    platformName:
      (capabilities.platformName ?? capabilities.platform ?? capabilities.desired?.platformName) || undefined,
    platformVersion: capabilities.platformVersion || undefined,
    isW3C: isW3C(capabilities),
    isMobile: isMobile(capabilities),
  }

  if (info.isMobile) {
    info.deviceName = (capabilities.desired?.deviceName ?? capabilities.deviceName) || undefined
    info.isNative = info.isMobile && !info.browserName
    info.isIOS = isIOS(capabilities)
    info.isAndroid = isAndroid(capabilities)
    info.orientation = (capabilities.deviceOrientation ?? capabilities.orientation)?.toLowerCase()
  }

  if (info.isNative) {
    info.pixelRatio = capabilities.pixelRatio
    info.statusBarHeight = capabilities.statBarHeight
  }

  return info
}

function isW3C(capabilities: Capabilities) {
  const isW3C = Boolean(
    (capabilities.platformName || capabilities.browserVersion) &&
      (capabilities.platformVersion || capabilities.hasOwnProperty('setWindowRect')),
  )
  return isW3C || isAppium(capabilities)
}

function isAppium(capabilities: Capabilities) {
  return (
    Boolean(capabilities.automationName || capabilities.deviceName || capabilities.appiumVersion) ||
    Object.keys(capabilities).some(cap => cap.startsWith('appium:'))
  )
}

function _isChrome(capabilities: Capabilities) {
  return Boolean(capabilities.chrome || capabilities['goog:chromeOptions'])
}

function _isFirefox(capabilities: Capabilities) {
  return capabilities.browserName === 'firefox' || Object.keys(capabilities).some(cap => cap.startsWith('moz:'))
}

function isMobile(capabilities: Capabilities) {
  return (
    capabilities.browserName === '' ||
    ['ipad', 'iphone', 'android'].includes(capabilities.browserName?.toLowerCase() ?? '') ||
    isAppium(capabilities)
  )
}

function isIOS(capabilities: Capabilities) {
  return /iOS/i.test(capabilities.platformName) || /(iPad|iPhone)/i.test(capabilities.deviceName)
}

function isAndroid(capabilities: Capabilities) {
  return /Android/i.test(capabilities.platformName) || /Android/i.test(capabilities.browserName)
}
