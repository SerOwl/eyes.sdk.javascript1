import {spec} from '@applitools/spec-driver-browser-extension'
import {Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {makeLogger} from '@applitools/logger'
const q = []

function log(...messages) {
  console.log('[screenshoter-ext]', ...messages)
}

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  const {menuItemId: selectedItem} = info
  const captureMode = {}
  if (selectedItem === 'capture-fullpage') captureMode.isFullPage = true
  else if (selectedItem === 'capture-viewport') captureMode.isFullPage = false
  else if (selectedItem === 'stitch-mode-css') captureMode.isCss = true
  else if (selectedItem === 'stitch-mode-scroll') captureMode.isCss = false
  if (captureMode.isFullPage) {
    chrome.contextMenus.update('capture-fullpage', {checked: !!captureMode.isFullPage})
    chrome.contextMenus.update('capture-viewport', {checked: !captureMode.isFullPage})
  }
  if (captureMode.isCss) {
    chrome.contextMenus.update('stitch-mode-css', {checked: !!captureMode.isCss})
    chrome.contextMenus.update('stitch-mode-scroll', {checked: !captureMode.isCss})
  }
  chrome.storage.local.set(captureMode)
  log('updated capture mode', captureMode)
})

chrome.storage.local.get(['isFullPage', 'isCss'], ({isFullPage, isCss}) => {
  if (!isFullPage) {
    isFullPage = true
    chrome.storage.local.set({isFullPage})
  }
  if (!isCss) {
    isCss = true
    chrome.storage.local.set({isCss})
  }
  log('creating context menus', {isFullPage, isCss})
  chrome.contextMenus.removeAll(() => {
    try {
      const parent = chrome.contextMenus.create({id: 'screenshoter', title: 'screenshoter settings'})
      chrome.contextMenus.create({id: 'capture-fullpage', parentId: parent, type: 'radio', title: 'capture full page', checked: !!isFullPage})
      chrome.contextMenus.create({id: 'capture-viewport', parentId: parent, type: 'radio', title: 'capture viewport', checked: !isFullPage})
      chrome.contextMenus.create({id: 'stitch-separator', parentId: parent, type: 'separator'})
      chrome.contextMenus.create({id: 'stitch-mode-css', parentId: parent, type: 'radio', title: 'stitch with css', checked: !!isCss})
      chrome.contextMenus.create({id: 'stitch-mode-scroll', parentId: parent, type: 'radio', title: 'stitch with scroll', checked: !isCss})
    } catch(error) {
      console.error(error)
    }
  })
})

async function captureScreenshot(driver, screenshotOptions) {
  log('capturing screenshot with', screenshotOptions)
  const {image} = await takeScreenshot({driver, ...screenshotOptions})
  const screenshot = image && await image.toPng()
  log('screenshot taken!', screenshot)
  return Buffer.from(screenshot).toString('base64')
}

async function makeWindowTargets() {
  const [focusedWindow] = await chrome.tabs.query({active: true, currentWindow: true})
  log('making window targets from', focusedWindow)
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

function sendNotification({title, message}) {
  try {
    chrome.notifications.create(
      {
        type: 'basic',
        title,
        message,
        iconUrl: 'assets/icon.png',
        requireInteraction: true,
      },
    )
  } catch (error) {
    console.error(error)
  }
}

function clearNotifications() {
  try {
    chrome.notifications.getAll(notifications => {
      Object.keys(notifications).forEach(notification => {
        log('clearing notification', notification)
        chrome.notifications.clear(notification) })
    })
  } catch (error) {
    console.error(error)
  }
}

chrome.action.onClicked.addListener(async () => {
  log('extension icon clicked')
  if (q.length) {
    log('screenshot in progress, notifying user and doing nothing')
    sendNotification({
      title: 'Screeenshot capture in progress',
      message: 'Please do not interact with browser window while image capture is in progress',
    })
    return
  }
  // pre-init (for scope)
  const title = await chrome.action.getTitle({})
  const {isFullPage, isCss} = await chrome.storage.local.get(['isFullPage', 'isCss'])
  const targets = await makeWindowTargets()
  try {
    log(`preparing to take screenshot`)
    sendNotification({
      title: 'Screeenshot capture in progress',
      message: 'Please do not interact with browser window while image capture is in progress',
    })
    chrome.action.setIcon({tabId: targets.activeTab, path: 'assets/in-progress.png'})
    chrome.action.setTitle({title: 'Screeenshot capture in progress'})
    // init
    q.push({isFullPage, isCss})
    log('queue is now', q)
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
        scrollingMode: !!isCss ? 'css' : 'scroll',
      }
    )

    // cleanup
    log('sending screenshot to the content script to store in the system clipboard')
    await chrome.tabs.sendMessage(targets.activeTab, {screenshot})
    log('notifying the user of completion')
    clearNotifications()
    sendNotification({
      title: 'Screeenshot captured',
      message: 'Image captured and saved to your system clipboard',
    })
    await chrome.action.setIcon({tabId: targets.activeTab, path: 'assets/done.png'})
    await chrome.action.setTitle({title: 'Screenshot saved to system clipboard'})
    await new Promise(res => setTimeout(res, 10000))
    clearNotifications()
  } finally {
    log('clearing queue')
    q.pop()
    await chrome.action.setIcon({tabId: targets.activeTab, path: 'assets/icon.png'})
    await chrome.action.setTitle({title})
    await new Promise(res => setTimeout(res, 5000))
    log('done!')
  }
})
