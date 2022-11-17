const q = []

// TODO:
// persist q to local storage
// cleanup q for windows that no longer exist
// test coverage

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "applitools-collab-open-sesame")
  port.onMessage.addListener(async function(msg) {
    console.log('message received from the content script (via the collab web app)', msg)
    const {requiredViewportSize, focusWindow} = msg
    if (focusWindow) {
      console.log('bringing open window into focus')
      chrome.windows.update(focusWindow, {focused: true})
      return
    }
    if (q.length) console.log('there is already a window in the queue, nothing to do', q)
    if (!q.length) {
      console.log('opening window')
      const {id: windowId} = await chrome.windows.create(
        {
          focused: true,
          width: 1024,
          height: 768,
          left: 10,
          top: 10,
          type: 'normal',
          url: msg.newWindowUrl || 'data:text/html,<h1>Hello, World!</h1>',
        },
      )
      console.log('window opened!')
      console.log('adding to the queue', {windowId, requiredViewportSize})
      q.push({windowId, requiredViewportSize})
      port.postMessage({windowId})
    }
  })
})
