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
        <input id="login-passphrase" type="password" placeholder="PGP Key Passphrase" value="" autofocus></input><br>
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
}

function submitLogin (e) {
  e.preventDefault()
  var fprlist = document.getElementById('key-fpr')
  var fpr = fprlist.options[fprlist.selectedIndex].value
  var passphrase = document.getElementById('login-passphrase').value

  function keyReady () {
    wrapper.dispatchEvent(new Event('mykey-ready'))
    chrome.storage.local.get('gg', function (dat) {
      if (typeof dat.gg === 'undefined') {
        routes('github', '')
      } else {
        var options = {
          message: openpgp.message.readArmored(dat.gg),
          privateKeys: [myKey]
        }
        openpgp.decrypt(options).then(me => {
          GG_CACHE = JSON.parse(me.data)
          routes('dash', '')
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
    function setInitListener () {
      if (b.blocktree.initialized) waitBltInit()
      else {
        b.blocktree.on('initialized', (e) => {
          waitBltInit()
        })
      }
    }
    if (!b.blocktree) {
      b.addEventListener('blocktree-avail', (e) => {
        setInitListener()
      })
    } else setInitListener()
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
    GG_CACHE = manifest.debug
  }
  wrapper.innerHTML = LOADING_TEMPLATE
  loadBlocktree()
})
