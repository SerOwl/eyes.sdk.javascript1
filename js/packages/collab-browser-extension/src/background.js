import {spec} from '@applitools/spec-driver-browser-extension'
import {Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {makeLogger} from '@applitools/logger'
const q = []

function log(...messages) {
  console.log(...messages)
}

//async function store(key, value) {
//  chrome.storage.local.set({[key]: value})
//}
//
//async function retrieve(key) {
//  const result = await chrome.storage.local.get([key])
//  return result[key]
//}

// TODO:
// change extension popup text if run on the collab app page?
// - e.g., navigate to a page in a different tab/window in order to take a screenshot
// beacon timeout (length TBD)
// local storage needed?
// - e.g., https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/#state
// test coverage where possible once ux stable
// this instead of how we're passing messages currently?
// - https://developer.chrome.com/docs/extensions/mv3/messaging/#external-webpage

async function captureScreenshot(driver, screenshotOptions) {
  log('capturing screenshot with', screenshotOptions)
  const {image} = await takeScreenshot({driver, ...screenshotOptions})
  const screenshot = image && await image.toPng()
  log('screenshot taken!', screenshot)
  return Buffer.from(screenshot).toString('base64')
}

async function makeWindowTargets() {
  const [focusedWindow] = await chrome.tabs.query({active: true, currentWindow: true})
  log('making window targets from', focusedWindow)
  const targets = {
    driver: {
      tabId: focusedWindow.id,
      windowId: focusedWindow.windowId,
    },
    debugger: {
      tabId: focusedWindow.id
    },
    origin: focusedWindow,
  }
  return targets
}

chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse) {
  log('message received from the content script (via the collab web app)', request)

  if (request.takeScreenshot) {
    // init
    const targets = await makeWindowTargets()
    const driver = await new Driver({
      driver: targets.driver,
      spec,
      logger: makeLogger(),
      customConfig: {}
    }).init()
    const job = q[0]

    // resize
    await driver.setViewportSize(job.requiredViewportSize)
    const screenshot = await captureScreenshot(
      driver,
      {
        fully: job.screenshot && job.screenshot.fullpage,
        scrollingMode: 'scroll',
      }
    )

    // cleanup
    log('restoring viewport size to its original state')
    await driver.setViewportSize({width: targets.origin.width, height: targets.origin.height})
    log('relaunching the extension popup')
    await chrome.action.openPopup()
    log('sending message to the collab app')
    chrome.tabs.sendMessage(job.caller.tabId,
      {
        ...job,
        type: 'FROM_EXTENSION',
        screenshot,
      }
    )
    log('sending message to the extension popup')
    chrome.runtime.sendMessage({screenshotComplete: true, caller: job.caller})
    log('emptying the queue')
    q.pop()
    log('done!')
    sendResponse(true)
  } else if (request.startBeacon) {
    const currentTab = await chrome.tabs.query({active: true, currentWindow: true})
    const caller = {tabId: currentTab[0].id, windowId: currentTab[0].windowId}
    // store window and tab id along with the request
    // but, Highlander rules, there can be only 1!
    q.splice(0, q.length, {caller, ...request})
    log('stored request into the queue, it now contains: ', q)
    sendResponse(true)
  } else if (request.healthCheck) {
    sendResponse({beaconStarted: !!q.length})
  }
  return true
})
