/* global BrowserFS:false Event:false Blocktree:true */
const config = {
  fs: 'LocalStorage',
  options: {
    '/tmp': {
      fs: 'InMemory'
    }
  }
}
var fs = false
var blocktree = false
var start = Date.now()
BrowserFS.configure(config, err => {
  if (err) throw err
  fs = BrowserFS.BFSRequire('fs')
  blocktree = new Blocktree(fs, 'gg')
  window.dispatchEvent(new Event('blocktree-avail'))
  fs.readdir(`/BLOCKTREE/gg/ledger/GULD`, (err, list) => {
    if (err) initBT(err)
    else fs.readdir(`/BLOCKTREE/gg/keys/pgp`, (err, list) => {
      if (err) return initBT(err)
      blocktree.initialized = true
      blocktree.emit('initialized')
    })
  })

})

chrome.runtime.onInstalled.addListener(function() {
  initBT()
})

function initBT (err) {
  if (err) console.log(err.message)
  chrome.storage.local.get('gg-initialized', inited => {
    if (!inited || !inited.hasOwnProperty('gg-initialized') || inited['gg-initialized'] === false) {
      chrome.storage.local.set({
        'gg-initialized': true
      }, () => {
        chrome.browserAction.disable()
        chrome.browserAction.setBadgeText({text: 'wait'})
        chrome.browserAction.setTitle({title: 'Loading initial blocktree snapshot, this may take up to 10 minutes.'})
        console.log(`starting blocktree init @ ${start}`)
        blocktree.initFS('gg', 'guld-games').then(() => {
          console.log(`${(Date.now() - start) / 1000} seconds to init blocktree`)
          chrome.browserAction.enable()
          chrome.browserAction.setBadgeText({text: ''})
          chrome.browserAction.setTitle({title: 'Play games on the guld blocktree.'})
        })
      })
    } else {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError)
    }
  })
}

chrome.management.onUninstalled.addListener(strid => {
  if (strid == chrome.runtime.id) {
    chrome.storage.local.set({
      'gg-initialized': false
    }, () => {
      localStorage.clear();
    })
  }
})
