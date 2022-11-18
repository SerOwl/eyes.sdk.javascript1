function log(msg, ...rest) {
  console.log('[content script]', ...messages)
}

const flag = document.createElement('div')
flag.style.display = 'none'
flag.id = 'applitools-collab-extension-loaded'
document.body.appendChild(flag)

window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source != window) {
    return
  }

  if (event.data.type && (event.data.type == 'FROM_PAGE')) {
    log('event data', event.data)
    chrome.runtime.sendMessage({startBeacon: true, ...event.data})
  }
}, false)

chrome.runtime.onMessage.addListener(function(msg) {
  log('msg received from background script', msg)
  window.postMessage({
    type: 'FROM_EXTENSION',
    ...msg
  })
})
