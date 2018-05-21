
module.exports.showBalances = (gname, comm) => {
  return getBackground().then((b) => {
    comm = comm || self.commodity
    var balDiv = document.getElementById('balance')
    var usdValDiv = document.getElementById('usd-value')
    var fullnameDiv = document.getElementById('fullname')
    var guldnameDiv = document.getElementById('guldname')

    if (fullnameDiv && guldnameDiv) {
      fullnameDiv.innerHTML = b.fullname
      guldnameDiv.innerHTML = b.guldname
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
  })
}

module.exports.getBalances = (gname, commodity) => {
  return getBackground().then((b) => {
    gname = gname || b.guldname
    commodity = commodity || 'GULD'
    var blnc
    var usdval
    return b.getBalance(gname, true).then(bal => {
      if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
        blnc = bal.Assets.__bal[commodity].value
        return b.blocktree.getPrice('GULD', '$').then(p => {
          if (commodity === 'GULD') { return [blnc, bal.Assets.__bal.GULD.value.mul(`${p.value}`)] } else {
            return b.blocktree.getPrice(commodity, 'GULD').then(pp => {
              return [blnc, bal.Assets.__bal[commodity].value.mul(`${p.value}`).mul(`${pp.value}`)]
            }).catch(e => {
              return [blnc, new Decimal(0)]
            })
          }
        })
      }
    })
  })
}

function getThenSetBalances (gname) {
  gname = gname || self.guldname

  function saveBals (bals) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(bals, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
        else resolve()
      })
    })
  }

  return new Promise((resolve, reject) => {
    getLedger().then(ledger => {
      ledger.balance().then(bals => {
        window.bals = bals
        if (bals && bals['guld']) {
          var dbBals = {}
          Object.keys(bals).forEach(n => {
            if (n.indexOf('_') === -1) {
              dbBals[`bal_${n}`] = bals[n]
            }
          })
          saveBals(dbBals).then(() => {
            resolve(bals[gname])
          }).catch(reject)
        } else reject(new Error('Unable to get balances from ledger.'))
      }).catch(reject)
    })
  })
}

