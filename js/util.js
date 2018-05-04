'use strict'

/* global openpgp:false fetch:false BrowserFS:false routes:false git:false Event:false */

if (typeof window === 'undefined' || !(window.openpgp)) {
  throw new ReferenceError('Openpgp is not avilable.')
}
var keyring = new openpgp.Keyring() // eslint-disable-line no-unused-vars
// keyring.clear()
// keyring.store()

var ERR_TEMPLATE = `<div id="err-div" class="row"> </div>` // eslint-disable-line no-unused-vars
var LOGO_TEMPLATE = // eslint-disable-line no-unused-vars
    `<img id="logo" src="images/logo.svg" alt="Guld Games" width="60%">`
const FOOTER_TEMPLATE = // eslint-disable-line no-unused-vars
`<div id="footer_menu"></div>`
const FOOTER_ITEMS_TEMPLATE = `
    <div class="menu_btn"><img src="images/footer_menu/wallet.svg"><div class="name">wallet</div></div>
    <div id="games_tab" class="menu_btn"><img src="images/footer_menu/games.svg"><div class="name">games</div></div>
    <div id="keys_tab" class="menu_btn"><img src="images/footer_menu/keys.svg"><div class="name">keys</div></div>
    <div id="hosts_tab" class="menu_btn"><img src="images/footer_menu/hosts.svg"><div class="name">hosts</div></div>
    `
const TOP_MENU_TEMPLATE = // eslint-disable-line no-unused-vars
    `<nav>
        <img id="logo_dash" src="images/logo2.svg">
        <div id="balance">
            <div class="balances"><span class="gg text-right">2.5147</span><span class="usd text-right">176.029</span></div>
            <div class="assets"><span class="gg text-left">GG</span><span class="usd text-left">USD</span></div>
        </div>
    </nav>`
const BACK_TEMPLATE = `<div id="back-div"><img src="images/back.svg"></div>` // eslint-disable-line no-unused-vars

var activeTab = 'games'
var wrapper
var manifest // eslint-disable-line no-unused-vars
var OAUTH_TOKEN // eslint-disable-line no-unused-vars
var myKey // eslint-disable-line no-unused-vars
var ghcreds // eslint-disable-line no-unused-vars
var gh // eslint-disable-line no-unused-vars
var USER = ""// eslint-disable-line no-unused-vars
var PASSWORD = "" // eslint-disable-line no-unused-vars
var EMAIL = "" // eslint-disable-line no-unused-vars
var b // eslint-disable-line no-unused-vars

function getTokenForCode(code) {
  return curl(`https://guld.gg/api/OAUTH_TOKEN?code=${code}`,
  {}).then(token => {
    OAUTH_TOKEN = token
    ghcreds = git.utils.oauth2('github', token)
    wrapper.dispatchEvent(new Event('oauth-ready'))
    return token
  })
}

function ghOAUTH () { // eslint-disable-line no-unused-vars
  var reulr = chrome.identity.getRedirectURL('provider_cb')
  var manifest = chrome.runtime.getManifest()
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

function load (err) { // eslint-disable-line no-unused-vars
  document.getElementById('err-div').innerHTML = `<p class="error">${err}</p>`
  // Footer menu
  if (keyring.privateKeys.keys.length > 0) {
    var footerMenu = document.getElementById('footer_menu')
    if (footerMenu) {
      footerMenu.innerHTML = FOOTER_ITEMS_TEMPLATE

      document.getElementById('games_tab').addEventListener('click', function () {
        activeTab = 'games'
        routes('dash', '')
      })

      document.getElementById('keys_tab').addEventListener('click', function () {
        activeTab = 'keys'
        routes('generate', '')
      })

      document.getElementById('hosts_tab').addEventListener('click', function () {
        activeTab = 'hosts'
        routes('github', '')
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

function curl (uri, settings) { // eslint-disable-line no-unused-vars
  settings = settings || {}
  if (uri.indexOf('github.com') >= 0 && OAUTH_TOKEN && !settings.hasOwnProperty('headers')) {
    var heads = {
      'authorization': `token ${OAUTH_TOKEN}`,
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

