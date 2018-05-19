/* global chrome:false openpgp:false fetch:false */

const git = require('../../isomorphic-git/src/index.js')
const GitHub = require('github-api')
const BrowserFS = require('../../BrowserFS/dist/browserfs.js')
const Buffer = require('buffer').Buffer
const { Decimal } = require('decimal.js')
const { EventEmitter } = require('events')
const highland = require('highland')
const Papa = require('papaparse')
const { Ledger } = require('ledger-cli')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('guld-lib')
const { Amount, Balance, Account } = require('ledger-types')
const { ChromeStorageFS } = require('chrome-storage-fs')

const knownApps = ['fjnccnnmidoffkjhcnnahfeclbgoaooo']
var fs = false

window.blocktree = false
window.manifest = chrome.runtime.getManifest()
window.gh
window.ghcreds // eslint-disable-line no-unused-vars
window.ghname
window.ghmail = ''
window.ghkeyid = ''
window.ghavatar
window.ghoauth = ''
window.guldname = 'guld'
window.guldmail = ''
window.guldfpr = ''
window.fullname = ''
window.keyring = new openpgp.Keyring()

// load the isomorphic-git openpgp plugin
//git.use(GitOpenPGP)

BrowserFS.configure({
  fs: "ChromeStorage",
  options: {
    "storeType": "local",
    "cacheSize": 10000
  }
}, function(e) {
  if (e) throw e
  fs = BrowserFS.BFSRequire('fs')
  self.getGuldID().then(self.bootstrapBlocktree).catch(self.bootstrapBlocktree)
});

// initialize the blocktree on first install
chrome.runtime.onInstalled.addListener(e => {
  setTimeout(self.bootstrapBlocktree, 1000)
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
    'url': chrome.extension.getURL('html/main.html')
  }, function (tab) {})
})

// API for other apps
chrome.runtime.onConnectExternal.addListener(function (port) {
  function extMessageHandler (msg) {
    switch (msg.cmd) {
      case 'getuser':
        var unlocked = false
        if (keyring.privateKeys.getForId(self.guldfpr) &&
          self.keyring.privateKeys.getForId(self.guldfpr).primaryKey &&
          self.keyring.privateKeys.getForId(self.guldfpr).primaryKey.isDecrypted)
          unlocked = true
        isRegistered(self.guldname).then(registered => {
          port.postMessage({
            'cmd': 'gotuser',
            'data': {
              'name': self.guldname,
              'email': self.guldmail,
              'fpr': self.guldfpr,
              'ghavatar': self.ghavatar,
              'unlocked': unlocked,
              'registered': registered
            }
          })
        })
        break
      case 'balance':
        self.getBalance(self.guldname, true).then(bal => {
          port.postMessage({
            'cmd': 'balance',
            'data': {
              'name': self.guldname,
              'balance': bal
            }
          })
        })
        break
      case 'price':
        var comm = 'GULD'
        if (msg.hasOwnProperty('commodity')) comm = msg.commodity
        var quote = '$'
        if (msg.hasOwnProperty('quote')) quote = msg.quote
        blocktree.getPrice(comm, quote).then(price => {
          port.postMessage({
            'cmd': 'price',
            'data': {
              'commodity': comm,
              'quote': quote,
              'price': price
            }
          })
        })
        break
      case 'readdir':
        var path = `/BLOCKTREE/${self.guldname}/`
        if (msg.hasOwnProperty('path')) {
          path = `/BLOCKTREE/${self.guldname}/${msg.path}`.replace(`/BLOCKTREE/${self.guldname}/BLOCKTREE/${self.guldname}`, `/BLOCKTREE/${self.guldname}`)
        }
        fs.readdir(path, (err, contents) => {
          if (err) {
            port.postMessage({
              'error': err
            })
          } else {
            port.postMessage({
              'cmd': 'readdir',
              'data': {
                'path': path,
                'contents': contents
              }
            })
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

window.bootstrapBlocktree = (obj) => {
  if (!fs) return
  blocktree = new Blocktree(fs, self.guldname)
  window.dispatchEvent(new Event('blocktree-avail'))
  fs.readdir(`/BLOCKTREE/${self.guldname}/ledger/GULD`, (err, list) => {
    if (err) initBlocktree(err)
    else {
      fs.readdir(`/BLOCKTREE/${self.guldname}/keys/pgp`, (err, list) => {
        if (err) return initBlocktree(err)
        blocktree.initialized = true
        blocktree.emit('initialized')
      })
    }
  })
}

function cloneGG () {
  var p = `/BLOCKTREE/${self.guldname}/ledger/GG`
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
        chrome.browserAction.setTitle({title: 'Loading initial blocktree snapshot, this may take up to half an hour.'})
        var start = Date.now()
        console.log(`starting blocktree init @ ${start}`) // eslint-disable-line no-console
        blocktree.initFS(self.guldname, 'guldcoin').then(cloneGG).then(() => {
            console.log(`${(Date.now() - start) / 1000} seconds to init fs and clone gg`) // eslint-disable-line no-console
          // also cache ledger and balances
          getLedger().then(ledger => {
            return self.getBalance()
          }).then(() => {
            console.log(`${(Date.now() - start) / 1000} seconds to init blocktree and ledger`) // eslint-disable-line no-console
            chrome.browserAction.enable()
            chrome.browserAction.setBadgeText({text: ''})
            chrome.browserAction.setTitle({title: 'Guld wallet and key manager.'})
          }).catch(console.error)
        }).catch(console.error)
      })
    } else {
      if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError) // eslint-disable-line no-console
    }
  })
}

window.forkGuld = () => { // eslint-disable-line no-unused-vars
  return Promise.all([
    self.gh.getRepo('guldcoin', 'ledger-guld').fork().catch(e => {}),
    self.gh.getRepo('guldcoin', 'keys-pgp').fork().catch(e => {}),
    self.gh.getRepo('tigoctm', 'token-prices').fork().catch(e => {}),
    self.gh.getRepo('guld-games', 'ledger-gg').fork().catch(e => {})
  ])
}

window.renameBlocktree = () => { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    fs.stat(`/BLOCKTREE/${self.guldname}`, (err, stats) => {
      if (err || !stats.isDirectory()) {
        fs.rename('/BLOCKTREE/guld', `/BLOCKTREE/${self.guldname}`, (err) => {
          if (err) reject(err)
          resolve()
        })
      } else resolve()
    })
  })
}

function getThenSetLedger () {
  return new Promise((resolve, reject) => {
    blocktree.setLedger().then(() => {
      chrome.storage.local.set({'journal': blocktree.getLedger().options.raw}, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
        else resolve(blocktree.getLedger())
      })
    }).catch(reject)
  })
}

function getLedger(useCache) {
  if (typeof useCache === 'undefined') useCache = true

  if (useCache) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['journal'], j => {
        if (j && j.journal) {
          blocktree._ledger = new Ledger({'file': '-', 'raw': j.journal, 'binary': 'chrome'})
          resolve(blocktree.getLedger())
        } else {
          getThenSetLedger().then(resolve).catch(reject)
        } 
      })
    })
  } else {
    return getThenSetLedger()
  }
}

function getThenSetBalances (gname) {
  gname = gname || self.guldname

  function saveBals (bals) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(bals, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
        else resolve()
      })    
    })
  }

  return new Promise((resolve, reject) => {
    getLedger().then(ledger => {
      ledger.balance().then(bals => {
        window.bals = bals
        if (bals && bals['guld']) {
          var dbBals = {}
          Object.keys(bals).forEach(n => {
            if (n.indexOf('_') === -1) {
              dbBals[`bal_${n}`] = bals[n]
            }
          })
          saveBals(dbBals).then(() => {
            resolve(bals[gname])
          }).catch(reject)
        } else reject(new Error("Unable to get balances from ledger."))
      }).catch(reject)
    })
  })
}

function reInitDecimal (dec) {
  var val = new Decimal(0)
	val.d = dec.d
	val.e = dec.e
	val.s = dec.s
  return val
}

function reInitAmount (amt) {
  if (amt instanceof Amount) return amt
	else return new Amount(reInitDecimal(amt.value), amt.commodity)
}

function reInitBalance (bal) {
  if (bal instanceof Balance) return bal
	else {
	  var balance = new Balance({})
    Object.keys(bal).forEach(b => {
      if (b.indexOf('_') === -1) {
        balance = balance.add(reInitAmount(bal[b]))
      }
    })
    return balance
	}
}

function reInitAccount (acct) {
  if (acct instanceof Account) return acct
	else {
	  var account = new Account(new Balance({}))
	  Object.keys(acct).forEach(act => {
	    if (act === '__bal') {
        account.__bal = reInitBalance(acct[act])
	    } else if (act.indexOf('_') === -1) {
	      account[act] = reInitAccount(acct[act])
	    }
	  })
	  return account
	}
}

window.getBalance = (gname, useCache) => {
  gname = gname || self.guldname
  if (typeof useCache === 'undefined') useCache = true
  if (useCache) {
    return new Promise((resolve, reject) => {
      var cacheKey = `bal_${gname}`
      chrome.storage.local.get([cacheKey], bal => {
        if (bal && bal[cacheKey]) {
          resolve(reInitAccount(bal[cacheKey]))
        } else {
          getThenSetBalances(gname).then(resolve).catch(reject)
        } 
      })
    })

  } else {
    return getThenSetBalances(gname)
  }
}

function isRegistered(gname) {
  gname = gname || self.guldname
  return getBalance('guld').then(bal => {
    return (
      bal &&
      bal.Income &&
      bal.Income.register &&
      bal.Income.register.individual &&
      bal.Income.register.individual[gname] &&
      bal.Income.register.individual[gname].__bal &&
      bal.Income.register.individual[gname].__bal.GULD &&
      bal.Income.register.individual[gname].__bal.GULD.value &&
      bal.Income.register.individual[gname].__bal.GULD.value.equals(new Decimal(-0.1))
    )
  })
}

function updateLedger (tx) {
  return new Promise((resolve, reject) => {
    getLedger().then(ledger => {
      var newJournal = `${ledger.options.raw}
${tx}
`
      chrome.storage.local.set({'journal': newJournal}, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
        else {
          getBalance(self.guldname, false).then(bal => {
            balance = bal
            resolve()
          }).catch(reject)
        }
      })
    })
  })
}

function gitCommit (partial, time) {
  return git.commit({
    fs: fs,
    dir: `/BLOCKTREE/${self.guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${self.guldname}/${partial}/.git`,
    message: `guld app transaction`,
    author: {
      name: self.fullname,
      email: self.guldmail,
      date: new Date(time * 1000),
      timestamp: time
    }
  })
}

function gitPull (partial) {
  return git.pull({
    fs: fs,
    dir: `/BLOCKTREE/${self.guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${self.guldname}/${partial}/.git`,
    ref: 'master',
    authUsername: self.ghoauth,
    authPassword: self.ghoauth
  })
}

function gitPush (partial) {
  return git.push({
    fs: fs,
    dir: `/BLOCKTREE/${self.guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${self.guldname}/${partial}/.git`,
    remote: 'origin',
    ref: 'master',
    authUsername: self.ghoauth,
    authPassword: self.ghoauth
  })
}

function gitSign (partial) {
  return git.sign({
    fs: fs,
    dir: `/BLOCKTREE/${self.guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${self.guldname}/${partial}/.git`,
    openpgp: openpgp,
    privateKeys: self.keyring.privateKeys.getForId(self.guldfpr)
  })
}

function gitAdd (partial, filepath) {
  return git.add({
    fs: fs,
    dir: `/BLOCKTREE/${self.guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${self.guldname}/${partial}/.git`,
    filepath: filepath
  })
}

window.writeTx = (tx, gname, comm, sender, time) => {
  gname = gname || self.guldname
  comm = comm || commodity
  sender = sender || gname
  time = time || Transaction.getTimestamp(tx)
  var gitDir = `/BLOCKTREE/${gname}/ledger/${comm}/.git`
  var repoDir = `/BLOCKTREE/${gname}/ledger/${comm}/${sender}/`
  return new Promise((resolve, reject) => {
    fs.mkdir(repoDir, err => {
      fs.writeFile(`${repoDir}${time}.dat`, tx.raw, err => {
        console.log(`wrote ${repoDir}${time}.dat`)
        if (err) reject(err)
        else {
          gitAdd(`ledger/${comm}`, `${sender}/${time}.dat`).then(() => {
            console.log(`${(Date.now() - time * 1000) / 1000} seconds to create and add tx`) // eslint-disable-line no-console
            gitCommit(`ledger/${comm}`, time).then(hash => {
              console.log(`${(Date.now() - time * 1000) / 1000} seconds to create unsigned commit ${hash}`) // eslint-disable-line no-console
              gitSign(`ledger/${comm}`).then(objid => {
                console.log(`${(Date.now() - time * 1000) / 1000} seconds to sign commit ${objid}`) // eslint-disable-line no-console
                updateLedger(tx.raw).then(resolve).catch(reject)
                gitPush(`ledger/${comm}`).then(results => {
                  if (results && results.ok)
                    console.log(`${(Date.now() - time * 1000) / 1000} seconds to push commit ${objid}`) // eslint-disable-line no-console

                  else reject(new Error(results.errors))
                }).catch(reject)
              }).catch(reject)
            }).catch(reject)
          }).catch(reject)
        }
      })
    })
  })
}

window.redirectAllRemotes = () => {
  return Promise.all(['ledger/GULD', 'ledger/GG', 'keys/pgp'].map(partial => {
    return redirectRemote(`/BLOCKTREE/${self.guldname}/${partial}/.git/config`)
  }))
}

function redirectRemote (dir) {
  return new Promise((resolve, reject) => {
    fs.readFile(dir, 'utf-8', (err, cfg) => {
      if (err) reject(err)
      else {
        fs.writeFile(dir, cfg.replace('guldcoin', self.ghname), err => {
          if (err) reject(err)
          else resolve()
        })
      }
    })
  })
}

// Github helpers

window.initGitHub = () => { // eslint-disable-line no-unused-vars
  self.gh = new GitHub({token: ghoauth})
  if (self.ghname && self.ghname.length > 0) return Promise.resolve()
  var guser = gh.getUser()
  return guser.getProfile().then(profile => {
    self.ghname = profile.data.login
    self.ghavatar = profile.data.avatar_url
    self.ghmail = profile.data.email
    return getGHKeys()
  })
}

function getGHKeys () {
  return self.curl(`https://api.github.com/users/${self.ghname}/gpg_keys`)
    .then(keys => {
      keys = JSON.parse(keys)
      if (keys.length !== 0) {
        self.ghkeyid = keys[0].key_id
        if (keys[0].emails.length !== 0) {
          self.ghmail = keys[0].emails[0].email
        }
      }
    })
}

window.setupGHKey = () => { // eslint-disable-line no-unused-vars
  if (!self.ghkeyid || self.ghkeyid.length === 0) {
    return self.curl(`https://api.github.com/user/gpg_keys`,
      {
        'method': 'POST',
        'body': JSON.stringify({'armored_public_key': self.keyring.publicKeys.getForId(self.guldfpr).armor()})
      }
    ).then(getGHKeys)
  } else return getGHKeys()
}

function getTokenForCode (code) {
  return self.curl(`https://guld.gg/api/OAUTH_TOKEN?code=${code}`,
    {}).then(token => {
    self.ghoauth = token
    self.ghcreds = git.utils.oauth2('github', token)
    // TODO move at least this event to new emitter
    blocktree.emit('oauth-ready')
    return token
  })
}

window.ghOAUTH = () => { // eslint-disable-line no-unused-vars
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

function createPR (org, repo) {
  return self.gh.getRepo(org, repo).createPullRequest({
    title: 'guld app created tx PR',
    head: `${self.guldname}:master`,
    base: 'master'
  })
}

/**
 * PGP helpers.
 */
function simpleSign (message) { // eslint-disable-line no-unused-vars
  var options = {
    data: message,
    privateKeys: [self.keyring.privateKeys.getForId(self.guldfpr)],
    detached: true
  }
  return openpgp.sign(options).then(function (signed) {
    return signed.signature
  })
}

function simpleDecrypt (message) {
  return openpgp.decrypt({
    message: openpgp.message.readArmored(message),
    privateKeys: [self.keyring.privateKeys.getForId(self.guldfpr)]
  }).then(record => {
    return record.data
  })
}

function simpleEncrypt (message) {
  return openpgp.encrypt({
    data: message,
    publicKeys: self.keyring.publicKeys.getForId(self.guldfpr),
    privateKeys: [self.keyring.privateKeys.getForId(self.guldfpr)]
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

window.getGuldID = () => {
  return getLocal(['guldname', 'guldmail', 'guldfpr', 'fullname']).then(data => {
    self.guldname = data.guldname || 'guld'
    self.guldmail = data.guldmail || ''
    self.guldfpr = data.guldfpr || ''
    self.fullname = data.fullname || ''
    return data
  }).catch(e => {
    self.guldname = 'guld'
    self.guldmail = ''
    self.guldfpr = ''
    self.fullname = ''
    return {
      guldname: self.guldname,
      guldmail: self.guldmail,
      guldfpr: self.guldfpr,
      fullname: self.fullname
    }
  })
}

window.setGuldID = () => { // eslint-disable-line no-unused-vars
  return setLocal({
    guldname: self.guldname,
    guldmail: self.guldmail,
    guldfpr: self.guldfpr,
    fullname: self.fullname
  })
}

function getGH () { // eslint-disable-line no-unused-vars
  return getLocal(['ghname', 'ghmail', 'ghkeyid', 'ghavatar', 'ghoauth']).then(vals => {
    self.ghname = vals.ghname
    self.ghmail = vals.ghmail
    self.ghkeyid = vals.ghkeyid
    self.ghavatar = vals.ghavatar
    if (self.guldfpr && vals.ghoauth.length > 0) {
      return simpleDecrypt(vals.ghoauth).then(token => {
        self.ghoauth = token
        return {
          ghname: self.ghname, 
          ghmail: self.ghmail,
          ghkeyid: self.ghkeyid, 
          ghavatar: self.ghavatar,
          ghoauth: self.ghoauth
        }
      })
    } else return {
      ghname: self.ghname,
      ghmail: self.ghmail,
      ghkeyid: self.ghkeyid, 
      ghavatar: self.ghavatar, 
      ghoauth: self.ghoauth
    }
  })
}

window.setGH = () => { // eslint-disable-line no-unused-vars
  if (ghoauth.length > 0) {
    return simpleEncrypt(self.ghoauth).then(enc => {
      return setLocal({
        ghname: self.ghname,
        ghmail: self.ghmail,
        ghkeyid: self.ghkeyid,
        ghavatar: self.ghavatar,
        ghoauth: enc
      })
    })
  } else {
    return setLocal({
      ghname: self.ghname,
      ghmail: self.ghmail,
      ghkeyid: self.ghkeyid,
      ghavatar: self.ghavatar,
      ghoauth: ''
    })
  }
}

// Semi-smart curl for simple fetching
window.curl = (uri, settings) => { // eslint-disable-line no-unused-vars
  settings = settings || {}
  if (uri.indexOf('github.com') >= 0 && self.ghoauth && !settings.hasOwnProperty('headers')) {
    var heads = {
      'authorization': `token ${self.ghoauth}`,
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
      fs.readdir(`/BLOCKTREE/${self.guldname}/ledger/GG/Games/LOTTERY/${game}`, (err, gfiles) => {
        if (err) resolve()
        if (gfiles.indexOf('GUESS.txt') === -1) {
          lopenGames.push(game)
          resolve()
        } else resolve()
      })
    })
  }

  return new Promise((resolve, reject) => {
    fs.readdir(`/BLOCKTREE/${self.guldname}/ledger/GG/Games/LOTTERY`, (err, games) => {
      if (err) return resolve([])
      Promise.all(games.map(checkGame)).then(() => {
        resolve(lopenGames)
      })
    })
  })
}
