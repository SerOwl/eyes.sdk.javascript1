'use strict'

function takeScreenshot() {
  chrome.runtime.sendMessage({takeScreenshot: true})
  document.querySelector('button').disabled = true
}

document.querySelector('button').addEventListener('click', takeScreenshot)

chrome.runtime.sendMessage({healthCheck: true}).then(result => {
  console.log('result', result)
  if (result.beaconStarted) {
    document.querySelector('#beacon-started').style.display = 'unset'
  } else {
    document.querySelector('#beacon-not-started').style.display = 'unset'
  }
})

chrome.runtime.onMessage.addListener(({screenshotComplete, caller}) => {
  console.log('caller', caller)
  const {tabId, windowId} = caller
  function goToCollabApp() {
    chrome.tabs.update(tabId, {active: true}).then(() => {
      chrome.windows.update(windowId, {focused: true}).then(() => {
        window.close()
      })
    })
  }
  if (screenshotComplete) {
    document.querySelector('#beacon-not-started').style.display = 'none'
    document.querySelector('#beacon-started').style.display = 'none'
    document.querySelector('#screenshot-complete').style.display = 'unset'
    document.querySelector('#screenshot-complete a').addEventListener('click', goToCollabApp)
  }
})
