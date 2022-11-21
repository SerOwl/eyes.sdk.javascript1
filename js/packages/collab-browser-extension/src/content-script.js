import {makeRefer} from '@applitools/spec-driver-browser-extension'

function log(...messages) {
  console.log('[content script]', ...messages)
}

window.refer = makeRefer({
  check: element => element instanceof Node,
  validate: element => {
    if (!element || !element.isConnected) {
      throw new Error('StaleElementReferenceError')
    }
  },
})

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
    chrome.runtime.sendMessage(event.data)
  }
}, false)

chrome.runtime.onMessage.addListener(function(msg) {
  log('msg received from background script', msg)
  window.postMessage({
    type: 'FROM_EXTENSION',
    ...msg
  })
})
