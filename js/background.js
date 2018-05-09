/* global BrowserFS:false Event:false Blocktree:false chrome:false */
const config = {
  fs: 'LocalStorage',
  options: {
    '/tmp': {
      fs: 'InMemory'
    }
  }
}
const knownApps = ['fjnccnnmidoffkjhcnnahfeclbgoaooo']
var fs = false
var blocktree = false
var manifest = chrome.runtime.getManifest()
var gh
var ghcreds
var ghname
var ghmail = ''
var ghkeyid = ''
var ghavatar
var ghoauth = ''
var guldname = 'guld'
var guldmail = ''
var guldfpr = ''
var fullname = ''
var keyring = new openpgp.Keyring()

// Load the filesystem and blocktree
BrowserFS.configure(config, err => {
  if (err) throw err
  fs = BrowserFS.BFSRequire('fs')
  getGuldID().then(bootstrapBlocktree).catch(bootstrapBlocktree)
})

// initialize the blocktree on first install
chrome.runtime.onInstalled.addListener(initBlocktree)

// set uninitialized on uninstall, and clear localstorage... redundant?
chrome.management.onUninstalled.addListener(strid => {
  if (strid == chrome.runtime.id) {
    chrome.storage.local.set({
      'guld-initialized': false
    }, () => {
      localStorage.clear();
    })
  }
})

// Open app in tab when user clicks on the icon
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({
    'url': chrome.extension.getURL('main.html')
  }, function(tab) {})
})

// API for other apps
chrome.runtime.onConnectExternal.addListener(function(port) {
  function extMessageHandler (msg) {
    console.log(JSON.stringify(msg))
    switch (msg.cmd) {
      case "getuser":
        port.postMessage({
          'cmd': 'gotuser',
          'data': {
            'name': guldname,
            'email': guldmail,
            'fpr': guldfpr,
            'ghavatar': ghavatar
          }
        })
        break
      default:
        port.postMessage({
          'error': 'unknown message type'
        })
    }
  }

  if (knownApps.indexOf(port.sender.id) == -1) return
  else port.onMessage.addListener(extMessageHandler)
})

// Guld helpers

function bootstrapBlocktree (obj) {
  if (obj instanceof Error) console.error(obj)
  blocktree = new Blocktree(fs, guldname)
  window.dispatchEvent(new Event('blocktree-avail'))
  fs.readdir(`/BLOCKTREE/${guldname}/ledger/GULD`, (err, list) => {
    if (err) initBlocktree(err)
    else fs.readdir(`/BLOCKTREE/${guldname}/keys/pgp`, (err, list) => {
      if (err) return initBlocktree(err)
      blocktree.initialized = true
      blocktree.emit('initialized')
    })
  })
}

function cloneGG () {
  var p = `/BLOCKTREE/${guldname}/ledger/GG`
  return git.clone({
    fs: fs,
    dir: p,
    gitdir: `${p}/.git`,
    url: "https://github.com/guld-games/ledger-gg.git",
    singleBranch: true,
    depth: 1
  })
}

function initBlocktree (err) {
  if (err && err instanceof Error) console.error(err)
  chrome.storage.local.get('guld-initialized', inited => {
    if (!inited || !inited.hasOwnProperty('guld-initialized') || inited['guld-initialized'] === false) {
      chrome.storage.local.set({
        'guld-initialized': true
      }, () => {
        chrome.browserAction.disable()
        chrome.browserAction.setBadgeText({text: 'wait'})
        chrome.browserAction.setTitle({title: 'Loading initial blocktree snapshot, this may take up to 10 minutes.'})
        var start = Date.now()
        console.log(`starting blocktree init @ ${start}`)
        blocktree.initFS(guldname, 'guldcoin').then(cloneGG).then(() => {
          console.log(`${(Date.now() - start) / 1000} seconds to init blocktree`)
          chrome.browserAction.enable()
          chrome.browserAction.setBadgeText({text: ''})
          chrome.browserAction.setTitle({title: 'Guld wallet and key manager.'})
        })
      })
    } else {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError)
    }
  })
}

// Github helpers

function initGitHub () {
  gh = new GitHub({token: ghoauth})
  if (ghname && ghname.length > 0) return Promise.resolve()
  var guser = gh.getUser()
  return guser.getProfile().then(profile => {
    ghname = profile.data.login
    ghavatar = profile.data.avatar_url
    ghmail = profile.data.email
    return curl(`https://api.github.com/users/${ghname}/gpg_keys`).then(keys => {
      keys = JSON.parse(keys)
      if (keys.length === 0) return
      else {
        ghkeyid = keys[0].key_id
        if (keys[0].emails.length !== 0) {
          ghmail = keys[0].emails[0].email
        }
      }
    })
  })
}

function getTokenForCode(code) {
  return curl(`https://guld.gg/api/OAUTH_TOKEN?code=${code}`,
  {}).then(token => {
    ghoauth = token
    ghcreds = git.utils.oauth2('github', token)
    window.dispatchEvent(new Event('oauth-ready'))
    return token
  })
}

function ghOAUTH () { // eslint-disable-line no-unused-vars
  var reulr = chrome.identity.getRedirectURL('provider_cb')
  var scope = encodeURIComponent(manifest.oauth2.scopes.join(' '))
  var options = {
    'interactive': true,
    'url': `https://github.com/login/oauth/authorize?client_id=${manifest.oauth2.client_id}&redirect_uri=${encodeURIComponent(reulr)}&scope=${scope}`
  }
  return new Promise((resolve, reject) => {
    function handler (rurl) {
      if (rurl) {
        var code = rurl.split('=')[1]
        getTokenForCode(code).then(resolve)
      } else {
        reject(chrome.runtime.lastError)
      }
    }
    try {
      chrome.identity.launchWebAuthFlow(options, handler)
    } catch (er) {
      reject(er)
    }  
  })
}

/**
 * PGP helpers.
 */
function simpleSign (message) {
  var options = {
    data: message,
    privateKeys: [keyring.privateKeys.getForId(guldfpr)],
    detached: true
  }
  return openpgp.sign(options).then(function (signed) {
    return signed.signature
  })
}

function simpleDecrypt (message) {
  openpgp.decrypt({
    message: openpgp.message.readArmored(message),
    privateKeys: [keyring.privateKeys.getForId(guldfpr)]
  }).then(record => {
    resolve(record.data)
  }).catch(reject)
}

function simpleEncrypt (message) {
  openpgp.encrypt({
    data: message,
    publicKeys: keyring.publicKeys.getForId(guldfpr),
    privateKeys: [keyring.privateKeys.getForId(guldfpr)]
  }).then(function (ciphertext) {
    resolve(ciphertext.data)
  }).catch(reject)
}

/**
 * Database helpers, which assume chrome.storage.local is used.
 */
function getLocal (keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, vals => {
      if (typeof chrome.runtime.lastError !== 'undefined')
        reject(chrome.runtime.lastError)
      else resolve(vals)
    })
  })
}

function setLocal (values) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      if (typeof chrome.runtime.lastError !== 'undefined')
        reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

function getGuldID () {
  return getLocal(['guldname', 'guldmail', 'guldfpr', 'fullname'])
}

function setGuldID () {
  return setLocal({
    guldname: guldname,
    guldmail: guldmail,
    guldfpr: guldfpr,
    fullname: fullname
  })
}

function getGH () {
  return getLocal(['ghname', 'ghmail', 'ghkeyid', 'ghavatar', 'ghoauth']).then(vals => {
    ghname = vals.ghname
    ghmail = vals.ghmail
    ghkeyid = vals.ghkeyid
    ghavatar = vals.ghavatar
    if (guldfpr && vals.ghoauth.length > 0) {
      return simpleDecrypt(vals.ghoauth).then(token => {
        ghoauth = token
        return {ghname: ghname, ghmail: ghmail, ghkeyid: ghkeyid, ghavatar: ghavatar, ghoauth: ghoauth}
      })
    } else return {ghname: ghname, ghmail: ghmail, ghkeyid: ghkeyid, ghavatar: ghavatar, ghoauth: ghoauth} 
  })
}

function setGH () {
  if (ghoauth.length > 0) {
    return simpleEncrypt(ghoauth).then(enc => {
      return setLocal({
        ghname: ghname,
        ghmail: ghmail,
        ghkeyid: ghkeyid,
        ghavatar: ghavatar,
        ghoauth: enc
      })
    })
  } else {
    return setLocal({
      ghname: ghname,
      ghmail: ghmail,
      ghkeyid: ghkeyid,
      ghavatar: ghavatar,
      ghoauth: ''
    })
  }
}

// Semi-smart curl for simple fetching
function curl (uri, settings) { // eslint-disable-line no-unused-vars
  settings = settings || {}
  if (uri.indexOf('github.com') >= 0 && ghoauth && !settings.hasOwnProperty('headers')) {
    var heads = {
      'authorization': `token ${ghoauth}`,
      'accept': 'application/json',
      'User-Agent': 'guld app'
    }
    settings['headers'] = heads
    settings['mode'] = 'cors'
  }
  return fetch(uri, settings).then(response => {
    if (response.ok) {
      return response.text()
    } else {
      throw new Error(`Could not reach the API`)
    }
  })
}

// TODO move this to gg-lib
function listOpenGames () {
  return new Promise((resolve, reject) => {
    fs.readdir(`/BLOCKTREE/${guldname}/ledger/GG/Games/LOTTERY`, (err, games) => {
      if (err) return resolve([])
      var lopenGames = []
      Promise.all(games.map(game => {
        return new Promise(resolv => {
          fs.readdir(`/BLOCKTREE/${guldname}/ledger/GG/Games/LOTTERY/${game}`, (err, gfiles) => {
            if (err) resolv()
            if (gfiles.indexOf('GUESS.txt') == -1) {
              lopenGames.push(game)
              resolv()
            } else resolv()
          })
        })
      })).then(() => {
        resolve(lopenGames)
      })
    })
  })
}

