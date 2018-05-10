/* global BrowserFS:false Event:false Blocktree:false chrome:false openpgp:false localStorage:false git:false GitHub:false fetch:false */
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
var ghcreds // eslint-disable-line no-unused-vars
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
window.Ledger = Ledger

// Load the filesystem and blocktree
BrowserFS.configure(config, err => {
  if (err) throw err
  fs = BrowserFS.BFSRequire('fs')
  getGuldID().then(bootstrapBlocktree).catch(bootstrapBlocktree)
})

// initialize the blocktree on first install
chrome.runtime.onInstalled.addListener(e => {
  setTimeout(initBlocktree, 1000)
})

// set uninitialized on uninstall, and clear localstorage... redundant?
chrome.management.onUninstalled.addListener(strid => {
  if (strid === chrome.runtime.id) {
    chrome.storage.local.set({
      'guld-initialized': false
    }, () => {
      localStorage.clear()
    })
  }
})

// Open app in tab when user clicks on the icon
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.create({
    'url': chrome.extension.getURL('main.html')
  }, function (tab) {})
})

// API for other apps
chrome.runtime.onConnectExternal.addListener(function (port) {
  function extMessageHandler (msg) {
    switch (msg.cmd) {
      case 'getuser':
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

  if (knownApps.indexOf(port.sender.id) !== -1) port.onMessage.addListener(extMessageHandler)
})

// Guld helpers

function bootstrapBlocktree (obj) {
  blocktree = new Blocktree(fs, guldname)
  window.dispatchEvent(new Event('blocktree-avail'))
  fs.readdir(`/BLOCKTREE/${guldname}/ledger/GULD`, (err, list) => {
    if (err) initBlocktree(err)
    else {
      fs.readdir(`/BLOCKTREE/${guldname}/keys/pgp`, (err, list) => {
        if (err) return initBlocktree(err)
        blocktree.initialized = true
        blocktree.emit('initialized')
      })
    }
  })
}

function cloneGG () {
  var p = `/BLOCKTREE/${guldname}/ledger/GG`
  return git.clone({
    fs: fs,
    dir: p,
    gitdir: `${p}/.git`,
    url: 'https://github.com/guld-games/ledger-gg.git',
    singleBranch: true,
    depth: 1
  })
}

function initBlocktree () {
  chrome.storage.local.get('guld-initialized', inited => {
    if (!inited || !inited.hasOwnProperty('guld-initialized') || inited['guld-initialized'] === false) {
      chrome.storage.local.set({
        'guld-initialized': true
      }, () => {
        chrome.browserAction.disable()
        chrome.browserAction.setBadgeText({text: 'wait'})
        chrome.browserAction.setTitle({title: 'Loading initial blocktree snapshot, this may take up to 10 minutes.'})
        var start = Date.now()
        console.log(`starting blocktree init @ ${start}`) // eslint-disable-line no-console
        blocktree.initFS(guldname, 'guldcoin').then(cloneGG).then(() => {
          console.log(`${(Date.now() - start) / 1000} seconds to init blocktree`) // eslint-disable-line no-console
          chrome.browserAction.enable()
          chrome.browserAction.setBadgeText({text: ''})
          chrome.browserAction.setTitle({title: 'Guld wallet and key manager.'})
        })
      })
    } else {
      if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError) // eslint-disable-line no-console
    }
  })
}

function forkGuld () { // eslint-disable-line no-unused-vars
  return Promise.all([
    gh.getRepo('guldcoin', 'ledger-guld').fork().catch(e => {}),
    gh.getRepo('guldcoin', 'keys-pgp').fork().catch(e => {}),
    gh.getRepo('tigoctm', 'token-prices').fork().catch(e => {}),
    gh.getRepo('guld-games', 'ledger-gg').fork().catch(e => {})
  ])
}

function renameBlocktree () { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    fs.stat(`/BLOCKTREE/${guldname}`, (err, stats) => {
      if (err || !stats.isDirectory()) {
        fs.rename('/BLOCKTREE/guld', `/BLOCKTREE/${guldname}`, (err) => {
          if (err) reject(err)
          resolve()
        })
      } else resolve()
    })
  })
}

// Github helpers

function initGitHub () { // eslint-disable-line no-unused-vars
  gh = new GitHub({token: ghoauth})
  if (ghname && ghname.length > 0) return Promise.resolve()
  var guser = gh.getUser()
  return guser.getProfile().then(profile => {
    ghname = profile.data.login
    ghavatar = profile.data.avatar_url
    ghmail = profile.data.email
    return getGHKeys()
  })
}

function getGHKeys () {
  return curl(`https://api.github.com/users/${ghname}/gpg_keys`)
    .then(keys => {
      keys = JSON.parse(keys)
      if (keys.length !== 0) {
        ghkeyid = keys[0].key_id
        if (keys[0].emails.length !== 0) {
          ghmail = keys[0].emails[0].email
        }
      }
    })
}

function setupGHKey () { // eslint-disable-line no-unused-vars
  if (!ghkeyid || ghkeyid.length === 0) {
    return curl(`https://api.github.com/user/gpg_keys`,
      {
        'method': 'POST',
        'body': JSON.stringify({'armored_public_key': keyring.publicKeys.getForId(guldfpr).armor()})
      }
    ).then(getGHKeys)
  } else return getGHKeys()
}

function getTokenForCode (code) {
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
function simpleSign (message) { // eslint-disable-line no-unused-vars
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
  return openpgp.decrypt({
    message: openpgp.message.readArmored(message),
    privateKeys: [keyring.privateKeys.getForId(guldfpr)]
  }).then(record => {
    return record.data
  })
}

function simpleEncrypt (message) {
  return openpgp.encrypt({
    data: message,
    publicKeys: keyring.publicKeys.getForId(guldfpr),
    privateKeys: [keyring.privateKeys.getForId(guldfpr)]
  }).then(function (ciphertext) {
    return ciphertext.data
  })
}

/**
 * Database helpers, which assume chrome.storage.local is used.
 */
function getLocal (keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, vals => {
      if (typeof chrome.runtime.lastError !== 'undefined') { reject(chrome.runtime.lastError) } else resolve(vals)
    })
  })
}

function setLocal (values) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      if (typeof chrome.runtime.lastError !== 'undefined') { reject(chrome.runtime.lastError) } else resolve()
    })
  })
}

function getGuldID () {
  return getLocal(['guldname', 'guldmail', 'guldfpr', 'fullname']).then(data => {
    guldname = data.guldname || 'guld'
    guldmail = data.guldmail || ''
    guldfpr = data.guldfpr || ''
    fullname = data.fullname || ''
    return data
  }).catch(e => {
    guldname = 'guld'
    guldmail = ''
    guldfpr = ''
    fullname = ''
    return {
      guldname: guldname,
      guldmail: guldmail,
      guldfpr: guldfpr,
      fullname: fullname
    }
  })
}

function setGuldID () { // eslint-disable-line no-unused-vars
  return setLocal({
    guldname: guldname,
    guldmail: guldmail,
    guldfpr: guldfpr,
    fullname: fullname
  })
}

function getGH () { // eslint-disable-line no-unused-vars
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

function setGH () { // eslint-disable-line no-unused-vars
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
function listOpenGames () { // eslint-disable-line no-unused-vars
  var lopenGames = []
  function checkGame (game) {
    return new Promise(resolve => {
      fs.readdir(`/BLOCKTREE/${guldname}/ledger/GG/Games/LOTTERY/${game}`, (err, gfiles) => {
        if (err) resolve()
        if (gfiles.indexOf('GUESS.txt') === -1) {
          lopenGames.push(game)
          resolve()
        } else resolve()
      })
    })
  }

  return new Promise((resolve, reject) => {
    fs.readdir(`/BLOCKTREE/${guldname}/ledger/GG/Games/LOTTERY`, (err, games) => {
      if (err) return resolve([])
      Promise.all(games.map(checkGame)).then(() => {
        resolve(lopenGames)
      })
    })
  })
}
