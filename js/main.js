'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  if (!b.guldname || b.guldname === 'guld' || !b.ghoauth || b.ghoauth.length === 0) {
    window.location = `chrome-extension://${chrome.runtime.id}/options.html`
  }
  document.getElementById('logout').addEventListener('click', logout)
  var balDiv = document.getElementById('balance')
  var usdValDiv = document.getElementById('usd-value')
  b.getBalance(b.guldname, true).then(bal => {
    console.log(bal)
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal.GULD) {
      balDiv.innerHTML = `${bal.Assets.__bal.GULD.value.toString()} GULD`
      b.blocktree.getPrice('GULD', '$').then(p => {
        usdValDiv.innerHTML = `(${bal.Assets.__bal.GULD.value.mul(p.value).toString()}) USD`
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadWallet)
})
