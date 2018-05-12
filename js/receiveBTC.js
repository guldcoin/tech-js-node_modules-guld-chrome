'use strict'

/* global b:false loadBackground:false logout:false */

function receiveBTC () { // eslint-disable-line no-unused-vars

  detectCommodity()
  showBalances(b.guldname, commodity)

  b.getBalance().then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      amtDiv.max = bal.Assets.__bal[commodity].value.toString()
      balance = bal.Assets.__bal[commodity].value
    }
  })

  new QRCode(document.getElementById("qrcode"), "http://guld.io");

}

