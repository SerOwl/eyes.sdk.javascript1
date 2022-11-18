'use strict'

function takeScreenshot() {
  chrome.runtime.sendMessage({takeScreenshot: true})
}

document.querySelector('button').addEventListener('click', takeScreenshot)

chrome.runtime.sendMessage({healthCheck: true}).then(result => {
  console.log('result', result)
  if (result.beaconStarted) {
    document.querySelector('#beacon-started').style.display = 'unset'
    document.querySelector('#beacon-not-started').style.display = 'none'
  }
})

chrome.runtime.onMessage.addListener(function(msg) {
  console.log('result', msg)
  if (msg.screenshotComplete) {
    document.querySelector('#beacon-started').style.display = 'none'
    document.querySelector('#beacon-not-started').style.display = 'unset'
  }
})
