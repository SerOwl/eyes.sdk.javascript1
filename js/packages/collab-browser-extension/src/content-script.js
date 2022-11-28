import {makeRefer} from '@applitools/spec-driver-browser-extension'

window.refer = makeRefer({
  check: element => element instanceof Node,
  validate: element => {
    if (!element || !element.isConnected) {
      throw new Error('StaleElementReferenceError')
    }
  },
})

chrome.runtime.onMessage.addListener(async function(msg) {
  console.log('msg received from background script', msg)
  if (msg.screenshot) {
    try {
      const fetchResult = await fetch(`data:image/png;base64,${msg.screenshot}`)
      const imageBlob = await fetchResult.blob()
      console.log('image blob created', imageBlob)
      console.log('writing to system clipboard')
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': imageBlob
        })
      ])
    } catch(error) {
      console.error(error)
    }
    console.log('done!')
  }
})
