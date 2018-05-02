'use strict'

/* global openpgp:false fetch:false BrowserFS:false routes:false */

if (typeof window === 'undefined' || !(window.openpgp)) {
  throw new ReferenceError('Openpgp is not avilable.')
}
const keyring = new openpgp.Keyring() // eslint-disable-line no-unused-vars
// keyring.clear()
// keyring.store()

const ERR_TEMPLATE = `<div id="err-div" class="row"> </div>` // eslint-disable-line no-unused-vars
const LOGO_TEMPLATE = // eslint-disable-line no-unused-vars
    `<img id="logo" src="images/logo.svg" alt="Guld Games" width="60%">`
const FOOTER_TEMPLATE = // eslint-disable-line no-unused-vars
`
    <div id="footer_menu">
    </div>`
const FOOTER_ITEMS_TEMPLATE = `
    <div class="menu_btn"><img src="images/footer_menu/wallet.svg"><div class="name">wallet</div></div>
    <div id="games_tab" class="menu_btn"><img src="images/footer_menu/games.svg"><div class="name">games</div></div>
    <div id="keys_tab" class="menu_btn"><img src="images/footer_menu/keys.svg"><div class="name">keys</div></div>
    <div id="hosts_tab" class="menu_btn"><img src="images/footer_menu/hosts.svg"><div class="name">hosts</div></div>
    `

var activeTab = 'games'

function load (err, key, passphrase) { // eslint-disable-line no-unused-vars
  document.getElementById('err-div').innerHTML = `<p class="error">${err}</p>`
  // Footer menu
  if (keyring.privateKeys.keys.length > 0) {
    document.getElementById('footer_menu').innerHTML = FOOTER_ITEMS_TEMPLATE

    document.getElementById('games_tab').addEventListener('click', function () {
      activeTab = 'games'
      routes('dash', function (next) {
        next('', key, passphrase)
      })
    })

    document.getElementById('keys_tab').addEventListener('click', function () {
      activeTab = 'keys'
      routes('generate', function (next) {
        next('', key, passphrase)
      })
    })

    document.getElementById('hosts_tab').addEventListener('click', function () {
      activeTab = 'hosts'
      routes('github', function (next) {
        next('', key, passphrase)
      })
    })

    if (activeTab === 'games') {
      document.getElementById('games_tab').classList.add('active')
    } else if (activeTab === 'keys') {
      document.getElementById('keys_tab').classList.add('active')
    } else if (activeTab === 'hosts') {
      document.getElementById('hosts_tab').classList.add('active')
    }
  }
}

function gpgSign (key, message) { // eslint-disable-line no-unused-vars
  var options = {
    data: message,
    privateKeys: [key],
    detached: true
  }
  openpgp.sign(options).then(function (signed) {
    // var cleartext = signed.data;
    // console.log(cleartext)
    // TODO return Promise
    console.log(signed.signature) // eslint-disable-line no-console
  })
}

function curl (url, settings, next, error) { // eslint-disable-line no-unused-vars
  if (!(settins.headers)) {
    settings.headers = new Headers({
      Origin: 'chrome-extension://fjnccnnmidoffkjhcnnahfeclbgoaooo'
    })
  }
  fetch(url, settings).then(function (response) {
    if (response.ok) {
      return response.json()
    } else {
      throw new Error(`Could not reach the API: ${response.statusText}`)
    }
  }).then(function (data) {
    next(data)
  }).catch(function (e) {
    error(e.message)
  })
}

function getBrowserFS (config) { // eslint-disable-line no-unused-vars
  config = config || {
    fs: 'LocalStorage',
    options: {
      '/tmp': {
        fs: 'InMemory'
      }
    }
  }
  return new Promise((resolve, reject) => {
    BrowserFS.configure(config, err => {
      if (err) reject(err)
      window.fs = BrowserFS.BFSRequire('fs')
      return resolve(window.fs)
    })
  })
}
