import {spec} from '@applitools/spec-driver-browser-extension'
import {Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {makeLogger} from '@applitools/logger'
let isFullPage = true
const q = []

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  const {menuItemId: selectedItem} = info
  if (selectedItem === 'capture-viewport') isFullPage = false
  else if (selectedItem === 'capture-fullpage') isFullPage = true
})

chrome.contextMenus.removeAll(() => {
  try {
    const parent = chrome.contextMenus.create({id: 'screenshoter', title: 'screenshoter'})
    chrome.contextMenus.create({id: 'capture-fullpage', parentId: parent, type: 'radio', title: 'capture full page', checked: !!isFullPage})
    chrome.contextMenus.create({id: 'capture-viewport', parentId: parent, type: 'radio', title: 'capture viewport', checked: !isFullPage})
  } catch(error) {
    console.error(error)
  }
})

async function captureScreenshot(driver, screenshotOptions) {
  console.log('capturing screenshot with', screenshotOptions)
  const {image} = await takeScreenshot({driver, ...screenshotOptions})
  const screenshot = image && await image.toPng()
  console.log('screenshot taken!', screenshot)
  return Buffer.from(screenshot).toString('base64')
}

async function makeWindowTargets() {
  const [focusedWindow] = await chrome.tabs.query({active: true, currentWindow: true})
  console.log('making window targets from', focusedWindow)
  const targets = {
    driver: {
      tabId: focusedWindow.id,
      windowId: focusedWindow.windowId,
    },
    debugger: {
      tabId: focusedWindow.id
    },
    activeTab: focusedWindow.id,
  }
  return targets
}

chrome.action.onClicked.addListener(async () => {
  console.log('extension icon clicked')
  if (q.length) {
    console.log('queue is not empty, ignoring user request')
    return
  }
  const title = await chrome.action.getTitle({})
  try {
    console.log('queue is empty, taking screenshot')
    chrome.action.setIcon({path: 'assets/in-progress.png'})
    chrome.action.setTitle({title: `taking ${isFullPage ? 'full page' : 'viewport'} screenshot...`})
    // init
    q.push({isFullPage})
    console.log('queue is now', q)
    const targets = await makeWindowTargets()
    const driver = await new Driver({
      driver: targets.driver,
      spec,
      logger: makeLogger(),
      customConfig: {}
    }).init()

    // do the thing
    const screenshot = await captureScreenshot(
      driver,
      {
        fully: !!isFullPage,
        scrollingMode: 'css',
      }
    )

    // cleanup
    console.log('sending screenshot to the content script to store in the system clipboard')
    chrome.tabs.sendMessage(targets.activeTab,
      {screenshot}
    )
    console.log('notifying the user of completion')
    await chrome.action.setIcon({path: 'assets/done.png'})
    await chrome.action.setTitle({title: 'screenshot saved to system clipboard'})
    await new Promise(res => setTimeout(res, 5000))
  } finally {
    console.log('clearing queue')
    q.pop()
    await chrome.action.setIcon({path: 'assets/icon.png'})
    await chrome.action.setTitle({title})
    await new Promise(res => setTimeout(res, 1000))
    console.log('done!')
  }
})
