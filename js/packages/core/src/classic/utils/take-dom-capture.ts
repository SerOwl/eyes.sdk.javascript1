import {type Driver} from '@applitools/driver'
import {type Logger} from '@applitools/logger'
import {getCaptureDomPoll, getPollResult, getCaptureDomPollForIE, getPollResultForIE} from '@applitools/dom-capture'
import req, {type Fetch} from '@applitools/req'

export type DomCaptureSettings = {fetch?: Fetch; executionTimeout?: number; pollTimeout?: number; chunkByteLength?: number}

export async function takeDomCapture<TDriver extends Driver<unknown, unknown, unknown, unknown>>({
  driver,
  settings,
  logger,
}: {
  driver: TDriver
  settings?: DomCaptureSettings
  logger: Logger
}) {
  const isLegacyBrowser = driver.isIE || driver.isEdgeLegacy
  const {canExecuteOnlyFunctionScripts} = driver.features
  const arg = {
    chunkByteLength:
      settings?.chunkByteLength ??
      (Number(process.env.APPLITOOLS_SCRIPT_RESULT_MAX_BYTE_LENGTH) || (driver.isIOS ? 100_000 : 250 * 1024 * 1024)),
  }
  const scripts = {
    main: canExecuteOnlyFunctionScripts
      ? require('@applitools/dom-capture').captureDomPoll
      : `return (${isLegacyBrowser ? await getCaptureDomPollForIE() : await getCaptureDomPoll()}).apply(null, arguments);`,
    poll: canExecuteOnlyFunctionScripts
      ? require('@applitools/dom-capture').pollResult
      : `return (${isLegacyBrowser ? await getPollResultForIE() : await getPollResult()}).apply(null, arguments);`,
  }

  const url = await driver.getUrl()
  const dom = await captureContextDom(driver.mainContext)

  // TODO save debug DOM like we have for debug screenshots
  return dom

  async function captureContextDom(context) {
    const capture = await context.executePoll(scripts, {
      main: arg,
      poll: arg,
      executionTimeout: settings?.executionTimeout ?? 5 * 60 * 1000,
      pollTimeout: settings?.pollTimeout ?? 200,
    })
    if (!capture) return {}
    const raws = capture.split('\n')
    const tokens = JSON.parse(raws[0])
    const cssEndIndex = raws.indexOf(tokens.separator)
    const frameEndIndex = raws.indexOf(tokens.separator, cssEndIndex + 1)
    let dom = raws[frameEndIndex + 1]

    const cssResources = await Promise.all(
      raws.slice(1, cssEndIndex).reduce((cssResources, href) => {
        return href ? cssResources.concat(fetchCss(new URL(href, url).href)) : cssResources
      }, []),
    )

    for (const {href, css} of cssResources) {
      dom = dom.replace(`${tokens.cssStartToken}${href}${tokens.cssEndToken}`, css)
    }

    const framePaths = raws.slice(cssEndIndex + 1, frameEndIndex)

    for (const xpaths of framePaths) {
      if (!xpaths) continue
      const references = xpaths.split(',').reduce((parent, selector) => {
        return {reference: {type: 'xpath', selector}, parent}
      }, null)
      let contextDom
      try {
        const frame = await context.context(references)
        contextDom = await captureContextDom(frame)
      } catch (ignored) {
        logger.log('Switching to frame failed')
        contextDom = {}
      }
      dom = dom.replace(`${tokens.iframeStartToken}${xpaths}${tokens.iframeEndToken}`, contextDom)
    }

    return dom
  }

  async function fetchCss(href) {
    try {
      logger.log(`Given URL to download: ${href}`)

      const response = await req(href, {
        retry: {
          limit: 1,
          validate: ({response, error}) => Boolean(error) || response.status >= 400,
        },
        fetch: settings.fetch,
      })
      if (response.status < 400) {
        const css = await response.text()
        logger.log(`downloading CSS in length of ${css.length} chars took`)
        return {href, css: cleanStringForJSON(css)}
      }
    } catch (err) {
      return {href, css: ''}
    }
  }

  function cleanStringForJSON(str) {
    if (str == null || str.length === 0) {
      return ''
    }

    let sb = ''
    let char = '\0'
    let tmp

    for (let i = 0, l = str.length; i < l; i += 1) {
      char = str[i]
      switch (char) {
        case '\\':
        case '"':
        case '/':
          sb += '\\' + char; // eslint-disable-line
          break
        case '\b':
          sb += '\\b'
          break
        case '\t':
          sb += '\\t'
          break
        case '\n':
          sb += '\\n'
          break
        case '\f':
          sb += '\\f'
          break
        case '\r':
          sb += '\\r'
          break
        default:
          if (char < ' ') {
            tmp = '000' + char.charCodeAt(0).toString(16); // eslint-disable-line
            sb += '\\u' + tmp.substring(tmp.length - 4); // eslint-disable-line
          } else {
            sb += char
          }
          break
      }
    }

    return sb
  }
}
