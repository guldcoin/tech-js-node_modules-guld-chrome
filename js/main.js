'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  setupPage()
  var commodity = 'GULD'
  if (window.location.href.indexOf("/gg/") >= 0) commodity = 'GG'
  showBalances(b.guldname, commodity)
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadWallet)
})
