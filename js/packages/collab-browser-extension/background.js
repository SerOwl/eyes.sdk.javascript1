const q = []

// TODO:
// timeout
// test coverage

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "applitools-collab-open-sesame")
  port.onMessage.addListener(async function(msg) {
    console.log('message received from the content script (via the collab web app)', msg)
    const {requiredViewportSize} = msg
    q.push({requiredViewportSize})
    console.log('stored request into the queue, it now contains: ', q)
  })
  chrome.runtime.onMessage.addListener(async ({takeScreenshot}) => {
    if (takeScreenshot) {
      // grab details from from q
      // resize viewport
      // capture screenshot
      await new Promise(res => setTimeout(res, 2000))
      // remove from q
      q.pop()
      port.postMessage({...q[0], type: 'FROM_EXTENSION', screenshot: 'blah'})
    }
    return true
  })
})
