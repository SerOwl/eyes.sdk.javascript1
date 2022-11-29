import {spec} from '@applitools/spec-driver-browser-extension'
import {Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {makeLogger} from '@applitools/logger'
let isFullPage = true

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  const {menuItemId: selectedItem} = info
  if (selectedItem === 'capture-viewport') isFullPage = false
  else if (selectedItem === 'capture-viewport') isFullPage = true
})

const parent = chrome.contextMenus.create({id: 'screenshoter', title: 'screenshoter'})
chrome.contextMenus.create({id: 'capture-fullpage', parentId: parent, type: 'radio', title: 'capture full page', checked: !!isFullPage})
chrome.contextMenus.create({id: 'capture-viewport', parentId: parent, type: 'radio', title: 'capture viewport', checked: !isFullPage})

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

async function resizeViewport(targetSize) {
  // TBD, TODO
  // options: have a make function, or return a restore function
  // await driver.setViewportSize(targetSize)
}

chrome.action.onClicked.addListener(async () => {
  // init
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
  chrome.notifications.create(
    {
      type: 'basic',
      title: 'screeenshot captured',
      message: `a ${isFullPage ? 'full page' : 'visible viewport'} image has been captured and stored in your system clipboard`,
      iconUrl: 'assets/icon.png',
    }
  )
  console.log('done!')
})
