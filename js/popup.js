'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false LOADING_TEMPLATE:false wrapper:true b:true initGitHub:false ghOAUTH:false openpgp:false myKey:true Event:false manifest:true USER:true */

function loadLogin (err) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  var keymap = keyring.privateKeys.keys.map(function (key) {
    var fpr = key.primaryKey.fingerprint
    return `<option value="${fpr}">${fpr}</option>`
  })
  var keyopts = keymap.join('\n')
  wrapper.innerHTML =
    `${LOGO_TEMPLATE}
    <form id="key-login-form">
    <div class="row text-right">
        <select id="key-fpr">${keyopts}</select>
        <a id="goto-generate-button" class="text-button" value="Generate">Manage keys</a><br>
    </div>

    <div class="row">
        <input id="login-passphrase" type="password" placeholder="PGP Key Passphrase" value="${PASSWORD}" autofocus></input><br>
    </div>

    <div class="row">
        <button id="login-submit" type="submit" value="Login">Login</button>
    </div>

    ${ERR_TEMPLATE}

    </form>`
  document.getElementById('key-login-form').addEventListener('submit', submitLogin)
  document.getElementById('goto-generate-button').addEventListener('click', function (e) {
    routes('generate', '')
  })
  load(err)
  // if debugging, auto-submit
  if (manifest.debug.pass.length > 0) submitLogin(new Event('submit'))
}

function submitLogin (e) {
  e.preventDefault()
  var fprlist = document.getElementById('key-fpr')
  var fpr = fprlist.options[fprlist.selectedIndex].value
  var passphrase = document.getElementById('login-passphrase').value

  function keyReady () {
    wrapper.dispatchEvent(new Event('mykey-ready'))
    chrome.storage.local.get('gh', function (dat) {
      if (typeof dat.gh === 'undefined') {
        routes('github', '')
      } else {
        var options = {
          message: openpgp.message.readArmored(dat.gh),
          privateKeys: [myKey]
        }
        openpgp.decrypt(options).then(me => {
          me = JSON.parse(me.data)
          OAUTH_TOKEN = me.oauth
          USER = me.username
          initGitHub().then(() => {
            routes('dash', '')
          }).catch(er => {
            routes('github', '')
          })
        })
      }
    })
  }

  myKey = keyring.privateKeys.getForId(fpr)
  if (myKey.primaryKey.isDecrypted) {
    keyReady()
  } else {
    myKey.decrypt(passphrase).then(keyReady)
  }
}

function loadBlocktree () {
  chrome.runtime.getBackgroundPage(bkg => {
    b = bkg
    function waitBltInit () {
      if (keyring.privateKeys.keys.length > 0) {
        routes('login', '')
      } else {
        routes('generate', '')
      }
    }
    if (!b.blocktree) {
      b.addEventListener('blockchain-avail', (e) => {
        waitBltInit()
      })
    } else waitBltInit()
  })
}
// Example ledger call

// chrome.runtime.sendNativeMessage('com.guld.ledger',
//  {'cmd': '--help'},
//  response => {
//    if (!response) {
//      wrapper.innerHTML = JSON.stringify(chrome.runtime.lastError)
//    }
//    wrapper.innerHTML = wrapper.innerHTML + response
//  }
// )

document.addEventListener('DOMContentLoaded', function () {
  wrapper = document.getElementById('wrapper')
  manifest = chrome.runtime.getManifest()
  if (manifest && manifest.debug && manifest.debug.user.length > 0) {
    USER = manifest.debug.user
    EMAIL = manifest.debug.email
    PASSWORD = manifest.debug.pass
  }
  wrapper.innerHTML = LOADING_TEMPLATE
  loadBlocktree()
})
