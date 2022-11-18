const q = []

function log(...messages) {
  console.log('[background script]', ...messages)
}

// TODO:
// timeout
// test coverage

chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse) {
  log('message received from the content script (via the collab web app)', request)

  if (request.takeScreenshot) {
    log('taking screenshot')
    // grab details from from q
    // resize viewport
    // capture screenshot
    await new Promise(res => setTimeout(res, 2000)) // to simulate screenshot capture
    log('screenshot taken!')
    log('sending result and cleaning up')
    chrome.tabs.sendMessage(q[0].beaconTabId, {...q[0], type: 'FROM_EXTENSION', screenshot: 'pretend this is a screenshot'})
    q.pop()
    log('done!')
    sendResponse(true)
  } else {
    const currentTab = await chrome.tabs.query({active: true, currentWindow: true})
    q.push({beaconTabId: currentTab[0].id, ...request})
    log('stored request into the queue, it now contains: ', q)
    sendResponse({beaconStarted: true})
  }
  return true
})
