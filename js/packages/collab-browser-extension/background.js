chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "applitools-collab-open-sesame")
  port.onMessage.addListener(function(msg) {
    console.log('message received from the content script (via the collab web app)', msg)
    console.log('opening window')
    chrome.windows.create(
      {
        focused: true,
        width: msg.size && msg.size.width || 800,
        height: msg.size && msg.size.height || 600,
        left: 10,
        top: 10,
        type: 'normal',
        url: msg.url || 'data:text/html,<h1>Hello, World!</h1>',
      },
    )
    console.log('window opened!')
  })
});
