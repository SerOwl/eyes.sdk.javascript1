const q = []

function log(...messages) {
  console.log('[background script]', ...messages)
}

async function store(key, value) {
  chrome.storage.local.set({[key]: value})
}

async function retrieve(key) {
  const result = await chrome.storage.local.get([key])
  return result[key]
}

// TODO:
// beacon timeout (length TBD)
// local storage needed?
// - e.g., https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/#state
// test coverage where possible once ux stable
// this instead of how we're passing messages currently?
// - https://developer.chrome.com/docs/extensions/mv3/messaging/#external-webpage

chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse) {
  try {
    log('message received from the content script (via the collab web app)', request)

    if (request.takeScreenshot) {
      log('taking screenshot')
      // TODO start
      // grab details from from q
      // resize window to required viewport size
      // capture screenshot
      await new Promise(res => setTimeout(res, 2000)) // to simulate screenshot capture
      // TODO end
      log('screenshot taken!')
      log('sending result and cleaning up')
      // message for the collab app
      chrome.tabs.sendMessage(q[0].caller.tabId, {...q[0], type: 'FROM_EXTENSION', screenshot: 'pretend this is a screenshot'})
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
  } catch (error) {
    console.warn(error.message)
  }
})
