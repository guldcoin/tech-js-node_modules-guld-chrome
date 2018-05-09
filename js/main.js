'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  document.getElementById('logout').addEventListener('click', logout)
  if (!b.guldname || b.guldname === 'guld' || !b.ghoauth || b.ghoauth.length === 0) {
    window.location = `chrome-extension://${chrome.runtime.id}/options.html`
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadWallet)
})
