import {spec} from '@applitools/spec-driver-browser-extension'
import {Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {makeLogger} from '@applitools/logger'
const q = []

function log(...messages) {
  console.log('[background script]', ...messages)
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

chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse) {
  log('message received from the content script (via the collab web app)', request)

  if (request.takeScreenshot) {
    log('taking screenshot')
    // TODO
    // - grab details from from q
    // - resize window to required viewport size
    // - BONUS POINTS: resize w/ cdp, re: https://chromedevtools.github.io/devtools-protocol/1-3/Emulation/#method-setDeviceMetricsOverride
    const targetWindow = await chrome.tabs.query({active: true, currentWindow: true})
    const page = {tabId: targetWindow[0].id, windowId: targetWindow.windowId}
    const driver = await new Driver({driver: page, spec, logger: makeLogger(), customConfig: {}}).init()
    const options = {
      fully: true,
      scrollingMode: 'scroll',
    }
    const {image} = await takeScreenshot({driver, ...options})
    //const imageBuffer = image && await image.toBuffer()
    const screenshot = image && await image.toPng()
    //await chrome.debugger.attach(target, '1.3')
    //const screenshot = await chrome.debugger.sendCommand(target, 'Page.captureScreenshot')
    //await chrome.debugger.detach(target)

    log('screenshot taken!', screenshot)
    log('sending result and cleaning up')
    // message for the collab app
    chrome.tabs.sendMessage(q[0].caller.tabId,
      {
        ...q[0],
        type: 'FROM_EXTENSION',
        screenshot: Buffer.from(screenshot).toString('base64'),
      }
    )
    // message for the extension popup
    chrome.runtime.sendMessage({screenshotComplete: true, caller: q[0].caller})
    // TODO restore winow size to what it was before resize
    q.pop()
    log('done!')
    sendResponse(true)
  } else if (request.startBeacon) {
    const currentTab = await chrome.tabs.query({active: true, currentWindow: true})
    const caller = {tabId: currentTab[0].id, windowId: currentTab[0].windowId}
    console.log('caller', caller)
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
