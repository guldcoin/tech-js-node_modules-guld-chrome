'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  setupPage()
  detectCommodity()
  showBalances(b.guldname, commodity)
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadWallet)
})
