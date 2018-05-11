'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  var usdVal = new Decimal(0)
  var usdTotalValDiv = document.getElementById('total-usd-value')
  showBalances(b.guldname, 'GULD')
  getBalances(b.guldname, 'GULD').then(bals => {
    document.getElementById('guld-balance').innerHTML = `${bals[0].toString()} GULD`
    usdVal = usdVal.plus(bals[1].toString())
    usdTotalValDiv.innerHTML = `~ ${usdVal.toDecimalPlaces(2).toString()} USD`
    getBalances(b.guldname, 'GG').then(bals => {
      document.getElementById('gg-balance').innerHTML = `${bals[0].toString()} GG`
      usdVal = usdVal.plus(bals[1].toString())
      usdTotalValDiv.innerHTML = `~ ${usdVal.toDecimalPlaces(2).toString()} USD`
    })
  })
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(setupPage).then(() => {
    switch(currentPage) {
      case 'send':
        loadSend()
        break
      case 'register':
        loadRegister()
        break
      case 'grant':
        loadGrant()
        break
      case 'burn':
        loadBurn()
        break
      case 'convert':
        loadConvert()
        break
      case 'deposit':
        loadDeposit()
        break
      case 'dash':
      default:
        loadWallet()
        break
    }
  })
})
