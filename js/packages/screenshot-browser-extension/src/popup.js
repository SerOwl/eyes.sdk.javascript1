'use strict'

function takeScreenshot() {
  chrome.runtime.sendMessage({takeScreenshot: true})
  document.querySelector('button').disabled = true
}

document.querySelector('button').addEventListener('click', takeScreenshot)

chrome.runtime.onMessage.addListener(({screenshotComplete, caller}) => {
  console.log('extension received response', caller)
  if (screenshotComplete) {
    console.log('screenshot complete, updating the ui')
    document.querySelector('#start-screenshot').style.display = 'none'
    document.querySelector('#end-screenshot').style.display = 'unset'
    window.close()
  }
})
