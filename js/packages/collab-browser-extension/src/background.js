import {spec} from '@applitools/spec-driver-browser-extension'
import {Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {makeLogger} from '@applitools/logger'

async function captureScreenshot(driver, screenshotOptions) {
  console.log('capturing screenshot with', screenshotOptions)
  const {image} = await takeScreenshot({driver, ...screenshotOptions})
  const screenshot = image && await image.toPng()
  console.log('screenshot taken!', screenshot)
  return Buffer.from(screenshot).toString('base64')
}

async function makeWindowTargets() {
  const [focusedWindow] = await chrome.tabs.query({active: true, currentWindow: true})
  console.log('making window targets from', focusedWindow)
  const targets = {
    driver: {
      tabId: focusedWindow.id,
      windowId: focusedWindow.windowId,
    },
    debugger: {
      tabId: focusedWindow.id
    },
    activeTab: focusedWindow.id,
  }
  return targets
}

async function resizeViewport(targetSize) {
  // TBD, TODO
  // options: have a make function, or return a restore function
  // await driver.setViewportSize(targetSize)
}

chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse) {
  console.log('message received from the content script (via the collab web app)', request)

  if (request.takeScreenshot) {
    // init
    const targets = await makeWindowTargets()
    const driver = await new Driver({
      driver: targets.driver,
      spec,
      logger: makeLogger(),
      customConfig: {}
    }).init()

    // do the thing
    const screenshot = await captureScreenshot(
      driver,
      {
        fully: true,
        scrollingMode: 'css',
      }
    )

    // cleanup
    // message to the extension popup (if it's still open)
    chrome.runtime.sendMessage({screenshotComplete: true})
    // there seems to be a race condition where the popup window doesn't close in time, which causes writing to the system clipboard to error
    await new Promise(res => setTimeout(res, 100))
    // message to the background script
    chrome.tabs.sendMessage(targets.activeTab,
      {screenshot}
    )
    console.log('done!')
    sendResponse(true)
  }
  return true
})
