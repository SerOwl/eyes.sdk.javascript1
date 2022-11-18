'use strict'

function takeScreenshot() {
  chrome.runtime.sendMessage({takeScreenshot: true})
}

document.querySelector('button').addEventListener('click', takeScreenshot)
