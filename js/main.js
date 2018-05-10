'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  setupPage()
  detectCommodity()
  var usdVal = new Decimal(0)
  var usdTotalValDiv = document.getElementById('total-usd-value')
  showBalances(b.guldname, 'GULD')
  getBalances(b.guldname, 'GULD').then(bals => {
    document.getElementById('guld-balance').innerHTML = `${bals[0].toString()} ${commodity}`
    usdVal = usdVal.plus(bals[1].toString())
    usdTotalValDiv.innerHTML = `~ ${usdVal.toString()} USD`
    getBalances(b.guldname, 'GG').then(bals => {
      document.getElementById('gg-balance').innerHTML = `${bals[0].toString()} ${commodity}`
      usdVal = usdVal.plus(bals[1].toString())
      usdTotalValDiv.innerHTML = `~ ${usdVal.toString()} USD`
    })
  })
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadWallet)
})
