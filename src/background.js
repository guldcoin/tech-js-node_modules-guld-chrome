/* global chrome:false */

const { apiMessageHandler } = require('./api.js')

chrome.browserAction.disable()
chrome.browserAction.setBadgeText({text: 'wait'})
chrome.browserAction.setTitle({title: 'Loading blocktree snapshot, this may take up to ten minutes.'})


// initialize the blocktree on first install
chrome.runtime.onInstalled.addListener(e => {
  setTimeout(() => {
    var now = new Date()
    var start = now.getTime()
    console.log(`starting blocktree init @ ${now.toLocaleString()}`) // eslint-disable-line no-console
    window.session.bootstrapBlocktree().then(() => {
        console.log(`${(Date.now() - start) / 60000} minutes to init fs and clone gg`) // eslint-disable-line no-console

//      console.log(`${(Date.now() - start) / 60000} minutes to init blocktree and ledger`) // eslint-disable-line no-console
      chrome.browserAction.enable()
      chrome.browserAction.setBadgeText({text: ''})
      chrome.browserAction.setTitle({title: 'Guld wallet and key manager.'})

    })
  }, 1000)
})

// set uninitialized on uninstall, and clear localstorage... redundant?
chrome.management.onUninstalled.addListener(strid => {
  if (strid === chrome.runtime.id) {
    chrome.storage.local.clear()
  }
})

// Open app in tab when user clicks on the icon
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.create({
    'url': chrome.extension.getURL('html/index.html')
  }, function (tab) {})
})

// API for other apps
chrome.runtime.onConnectExternal.addListener(function (port) {
  if (knownApps.indexOf(port.sender.id) !== -1) port.onMessage.addListener(apiMessageHandler)
})

