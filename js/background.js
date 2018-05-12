/* global BrowserFS:false Event:false Blocktree:false chrome:false openpgp:false localStorage:false git:false GitHub:false fetch:false */

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

//var worker = new Worker('js/fs.js')
//function tryToGetFS () {
//  return Promise.race([
//    new Promise((resolve, reject) => {
//      BrowserFS.configure({
//        fs: 'WorkerFS',
//        options: {
//          worker: worker
//        }
//      }, err => {
//        if (err) {
//          return tryToGetFS().then(resolve).catch(reject)
//        } else {
//          fs = BrowserFS.BFSRequire('fs')
//          return resolve(fs)
//        }
//      })
//    }),
//    new Promise(resolve => {
//      setTimeout(resolve, 1000)
//    })
//  ]).then(() => {
//    if (!fs) return tryToGetFS()
//    else {
//      return fs
//      BrowserFS.FileSystem.WorkerFS.attachRemoteListener(worker)
//    }
//  })
//}

//tryToGetFS().then(getGuldID).then(bootstrapBlocktree).catch(bootstrapBlocktree)

// load the isomorphic-git openpgp plugin
//git.use(GitOpenPGP)

// Load the filesystem and blocktree
BrowserFS.configure({
  fs: 'LocalStorage',
  options: {
    '/tmp': {
      fs: 'InMemory'
    }
  }
}, err => {
  if (err) throw err
  fs = BrowserFS.BFSRequire('fs')
  getGuldID().then(bootstrapBlocktree).catch(bootstrapBlocktree)
})

// initialize the blocktree on first install
chrome.runtime.onInstalled.addListener(e => {
  setTimeout(bootstrapBlocktree, 1000)
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
    'url': chrome.extension.getURL('html/main.html')
  }, function (tab) {})
})

// API for other apps
chrome.runtime.onConnectExternal.addListener(function (port) {
  function extMessageHandler (msg) {
    switch (msg.cmd) {
      case 'getuser':
        var unlocked = false
        if (keyring.privateKeys.getForId(guldfpr) &&
          keyring.privateKeys.getForId(guldfpr).primaryKey &&
          keyring.privateKeys.getForId(guldfpr).primaryKey.isDecrypted)
          unlocked = true
        isRegistered(guldname).then(registered => {
          port.postMessage({
            'cmd': 'gotuser',
            'data': {
              'name': guldname,
              'email': guldmail,
              'fpr': guldfpr,
              'ghavatar': ghavatar,
              'unlocked': unlocked,
              'registered': registered
            }
          })
        })
        break
      case 'balance':
        getBalance(guldname, true).then(bal => {
          port.postMessage({
            'cmd': 'balance',
            'data': {
              'name': guldname,
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
        var path = `/BLOCKTREE/${guldname}/`
        if (msg.hasOwnProperty('path')) {
          path = `/BLOCKTREE/${guldname}/${msg.path}`.replace(`/BLOCKTREE/${guldname}/BLOCKTREE/${guldname}`, `/BLOCKTREE/${guldname}`)
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

function bootstrapBlocktree (obj) {
  if (!fs) return
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
  console.log(`cloning ${p}`)
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
        blocktree.initFS(guldname, 'guldcoin').then(cloneGG).then(() => {
            console.log(`${(Date.now() - start) / 1000} seconds to init fs and clone gg`) // eslint-disable-line no-console
          // also cache ledger and balances
          getLedger().then(getBalance()).then(() => {
            console.log(`${(Date.now() - start) / 1000} seconds to init blocktree and ledger`) // eslint-disable-line no-console
            chrome.browserAction.enable()
            chrome.browserAction.setBadgeText({text: ''})
            chrome.browserAction.setTitle({title: 'Guld wallet and key manager.'})
          })
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
  gname = gname || guldname

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

function getBalance(gname, useCache) {
  gname = gname || guldname
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
  gname = gname || guldname
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
          getBalance(guldname, false).then(bal => {
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
    dir: `/BLOCKTREE/${guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${guldname}/${partial}/.git`,
    message: `guld app transaction`,
    author: {
      name: fullname,
      email: guldmail,
      date: new Date(time * 1000),
      timestamp: time
    }
  })
}

function gitPull (partial) {
  return git.pull({
    fs: fs,
    dir: `/BLOCKTREE/${guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${guldname}/${partial}/.git`,
    ref: 'master',
    authUsername: ghoauth,
    authPassword: ghoauth
  })
}

function gitPush (partial) {
  return git.push({
    fs: fs,
    dir: `/BLOCKTREE/${guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${guldname}/${partial}/.git`,
    remote: 'origin',
    ref: 'master',
    authUsername: ghoauth,
    authPassword: ghoauth
  })
}

function gitSign (partial) {
  return git.sign({
    fs: fs,
    dir: `/BLOCKTREE/${guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${guldname}/${partial}/.git`,
    openpgp: openpgp,
    privateKeys: keyring.privateKeys.getForId(guldfpr)
  })
}

function gitAdd (partial, filepath) {
  return git.add({
    fs: fs,
    dir: `/BLOCKTREE/${guldname}/${partial}/`,
    gitdir: `/BLOCKTREE/${guldname}/${partial}/.git`,
    filepath: filepath
  })
}

function writeTx (tx, gname, comm, sender, time) {
  gname = gname || guldname
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

function redirectAllRemotes () {
  return Promise.all(['ledger/GULD', 'ledger/GG', 'keys/pgp'].map(partial => {
    return redirectRemote(`/BLOCKTREE/${guldname}/${partial}/.git/config`)
  }))
}

function redirectRemote (dir) {
  return new Promise((resolve, reject) => {
    fs.readFile(dir, 'utf-8', (err, cfg) => {
      if (err) {
        console.error(JSON.stringify(err))
        reject(err)
      }
      else {
        fs.writeFile(dir, cfg.replace('guldcoin', ghname), err => {
          if (err) {
            console.error(err)
            reject(err)
          }
          else resolve()
        })
      }
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

function createPR (org, repo) {
  return gh.getRepo(org, repo).createPullRequest({
    title: 'guld app created tx PR',
    head: `${guldname}:master`,
    base: 'master'
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
