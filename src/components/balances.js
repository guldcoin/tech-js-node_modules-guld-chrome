const {Decimal} = require('decimal.js')

async function showBalances (gname, comm) {
  gname = gname || this.name || this.observer.name
  var balDiv = document.getElementById('balance')
  var usdValDiv = document.getElementById('usd-value')
  var fullnameDiv = document.getElementById('fullname')
  var guldnameDiv = document.getElementById('guldname')

  if (fullnameDiv && guldnameDiv) {
    fullnameDiv.innerHTML = this.observer.fullname
    guldnameDiv.innerHTML = gname
  }

  function setUSD (dec) {
    usdValDiv.innerHTML = `~ ${dec.toString()} USD`
  }
  if (balDiv && usdValDiv) {
    getBalances(gname, comm).then(bals => {
      if (bals) {
        balDiv.innerHTML = `${bals[0].toString()} ${comm}`
        usdValDiv.innerHTML = `~ ${bals[1].toDecimalPlaces(2).toString()} USD`
      }
    })
  }
}

async function getBalances (gname, commodity) {
  gname = gname || this.name || this.observer.name
  commodity = commodity || 'GULD'
  var blnc
  var usdval
  var bal = await this.ledger.getBalance(gname, true)
  if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
    blnc = bal.Assets.__bal[commodity].value
    var p = await this.ledger.getPrice('GULD', '$')
    if (commodity === 'GULD') { return [blnc, bal.Assets.__bal.GULD.value.mul(`${p.value}`)] } else {
      var pp = (await this.ledger.getPrice(commodity, 'GULD')).catch(e => new Decimal(0))
      return [blnc, bal.Assets.__bal[commodity].value.mul(`${p.value}`).mul(`${pp.value}`)]
    }
  }
}

async function getThenSetBalances (gname) {
  gname = gname || this.name || this.observer.name
  var self = this
  return new Promise(async (resolve, reject) => {
    var ledger = await self.ledger.getLedger()
    var bals = ledger.balance()
    return bals
  })
}

module.exports = {
  showBalances: showBalances,
  getBalances: getBalances,
  getThenSetBalances: getThenSetBalances
}
