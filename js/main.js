'use strict'

/* global b:false loadBackground:false logout:false */

function loadWallet () { // eslint-disable-line no-unused-vars
  var usdVal = new Decimal(0)
  var usdTotalValDiv = document.getElementById('total-usd-value')
  showBalances(b.guldname, 'GULD')
  getBalances(b.guldname, 'GULD').then(bals => {
    console.log(bals[0].toString())
    document.getElementById('guld-balance').innerHTML = `${bals[0].toString()} GULD`
    console.log(bals[1].toString())
    usdVal = usdVal.plus(bals[1].toString())
    console.log(usdVal.toString())
    usdTotalValDiv.innerHTML = `~ ${usdVal.toString()} USD`
    console.log(usdVal)
    getBalances(b.guldname, 'GG').then(bals => {
      console.log(bals)
      document.getElementById('gg-balance').innerHTML = `${bals[0].toString()} GG`
      usdVal = usdVal.plus(bals[1].toString())
      usdTotalValDiv.innerHTML = `~ ${usdVal.toString()} USD`
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
      case 'dash':
      default:
        loadWallet()
        break
    }
  })
})
