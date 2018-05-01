'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false loadGenerate:false LOADING_TEMPLATE:false Blocktree:false getBrowserFS:false */

var blocktree // eslint-disable-line no-unused-vars

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
        <button id="goto-generate-button" class="text-button" value="Generate">Manage keys</button><br>
    </div>

    <div class="row">
        <input id="login-passphrase" type="password" placeholder="PGP Key Passphrase"></input><br>
    </div>

    <div class="row">
        <button id="login-submit" type="submit" value="Login">Login</button>
    </div>

    ${ERR_TEMPLATE}

    </form>`
  document.getElementById('key-login-form').addEventListener('submit',
    submitLogin)
  document.getElementById('goto-generate-button').addEventListener('click',
    loadGenerate)
  load(err)
}

function submitLogin () {
  var fprlist = document.getElementById('key-fpr')
  var fpr = fprlist.options[fprlist.selectedIndex].value
  var passphrase = document.getElementById('login-passphrase').value
  var key = keyring.privateKeys.getForId(fpr)
  routes('decrypt', function (next) {
    next('', key, passphrase)
  })
}

function loadBlocktree (fs) {
  blocktree = new Blocktree(fs, 'gg')

  if (keyring.privateKeys.keys.length > 0) {
    routes('login', function (next) {
      next('')
    })
  } else {
    routes('generate', function (next) {
      next('')
    })
  }
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
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = LOADING_TEMPLATE
  getBrowserFS().then(loadBlocktree)
})
