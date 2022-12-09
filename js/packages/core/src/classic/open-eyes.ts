import type {Eyes, Target, OpenSettings} from './types'
import type {Core as BaseCore} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {makeDriver, type SpecDriver} from '@applitools/driver'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeLocateText} from './locate-text'
import {makeExtractText} from './extract-text'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  core: BaseCore
  logger?: Logger
}

export function makeOpenEyes<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function openEyes({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings: OpenSettings
    logger?: Logger
  }): Promise<Eyes<TDriver, TElement, TSelector>> {
    logger.log(`Command "openEyes" is called with ${spec?.isDriver(target) ? 'default driver and' : ''} settings`, settings)

    // TODO driver custom config
    const driver = spec?.isDriver(target)
      ? await makeDriver({spec, driver: target, logger, customConfig: {useCeilForViewportSize: settings.useCeilForViewportSize}})
      : null

    if (driver) {
      const currentContext = driver.currentContext
      settings.environment ??= {}
      if (!settings.environment.viewportSize || driver.isMobile) {
        const size = await driver.getViewportSize()
        settings.environment.viewportSize = utils.geometry.scale(size, driver.viewportScale)
      } else {
        await driver.setViewportSize(settings.environment.viewportSize)
      }

      if (driver.isWeb) {
        settings.environment.userAgent ??= driver.userAgent

        if (
          driver.isChromium &&
          ((driver.isWindows && Number.parseInt(driver.browserVersion as string) >= 107) ||
            (driver.isMac && Number.parseInt(driver.browserVersion as string) >= 90))
        ) {
          settings.environment.os = `${driver.platformName} ${driver.platformVersion ?? ''}`.trim()
        }
      }

      if (!settings.environment.deviceName && driver.deviceName) {
        settings.environment.deviceName = driver.deviceName
      }

      if (!settings.environment.os && driver.isNative && driver.platformName) {
        settings.environment.os = driver.platformName
        if (!settings.keepPlatformNameAsIs) {
          if (settings.environment.os?.startsWith('android')) {
            settings.environment.os = `Android${settings.environment.os.slice(7)}`
          }
          if (settings.environment.os?.startsWith('ios')) {
            settings.environment.os = `iOS${settings.environment.os.slice(3)}`
          }
        }
        if (driver.platformVersion) {
          settings.environment.os += ` ${driver.platformVersion}`
        }
      }
      await currentContext.focus()
    }

    const eyes = await core.openEyes({settings, logger})

    return utils.general.extend(eyes, {
      check: makeCheck({spec, eyes, target, logger}),
      checkAndClose: makeCheckAndClose({spec, eyes, target, logger}),
      locateText: makeLocateText({spec, eyes, target, logger}),
      extractText: makeExtractText({spec, eyes, target, logger}),
    })
  }
}
