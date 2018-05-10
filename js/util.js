/* global chrome:false */

var b
var errdiv
var commodity = 'GULD'
var balance = new Decimal(0)
var amount = new Decimal(0)
var senderDiv
var recDiv
var amtDiv


function loadBackground () { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    chrome.runtime.getBackgroundPage(bkg => {
      b = bkg
      function setInitListener () {
        if (b.blocktree.initialized) resolve()
        else {
          b.blocktree.on('initialized', (e) => {
            resolve()
          })
        }
      }
      if (!b.blocktree) {
        b.addEventListener('blocktree-avail', (e) => {
          setInitListener()
        })
      } else setInitListener()
    })
  })
}

function setupPage () {
  if (!b.guldname || b.guldname === 'guld' || !b.ghoauth || b.ghoauth.length === 0) {
    window.location = `chrome-extension://${chrome.runtime.id}/options.html`
  }
  document.getElementById('logout').addEventListener('click', logout)
}

function setError (errmess) { // eslint-disable-line no-unused-vars
  if (typeof errdiv === 'undefined') errdiv = document.getElementById('err-div')
  if (errdiv.innerHTML.indexOf(errmess) === -1)
    errdiv.innerHTML = `${errmess}${errdiv.innerHTML}`
}

function unsetError (errmess) { // eslint-disable-line no-unused-vars
  if (typeof errdiv === 'undefined') errdiv = document.getElementById('err-div')
  errdiv.innerHTML = errdiv.innerHTML.replace(new RegExp(errmess, 'g'), '')
}

function logout (e) { // eslint-disable-line no-unused-vars
  if (e && e.preventDefault) e.preventDefault()
  b.gh = undefined
  b.ghcreds = undefined
  b.ghname = ''
  b.ghmail = ''
  b.ghkeyid = ''
  b.ghavatar = ''
  b.ghoauth = ''
  b.guldname = 'guld'
  b.guldmail = ''
  b.guldfpr = ''
  b.fullname = ''
  b.keyring = new b.openpgp.Keyring()
  window.location = `chrome-extension://${chrome.runtime.id}/options.html`
}

function getBalances (gname, commodity) {
  gname = gname || b.guldname
  commodity = commodity || 'GULD'
  var blnc
  var usdval
  return b.getBalance(gname, true).then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      blnc = bal.Assets.__bal[commodity].value
      return b.blocktree.getPrice('GULD', '$').then(p => {
        if (commodity === 'GULD')
          return [blnc, bal.Assets.__bal.GULD.value.mul(p.value)]
        else {
          return b.blocktree.getPrice(commodity, 'GULD').then(pp => {
            return [blnc, bal.Assets.__bal[commodity].value.mul(p.value).mul(pp.value)]
          }).catch(e => {
            return [blnc, new Decimal(0)]
          })
        }
      })
    }
  })
}

function showBalances (gname, commodity) {
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
    getBalances(gname, commodity).then(bals => {
      balDiv.innerHTML = `${bals[0].toString()} ${commodity}`
      usdValDiv.innerHTML = `~ ${bals[1].toString()} USD`
    })
  }
}

function validateSender () {
  senderDiv = senderDiv || document.getElementById('guld_transaction_sender')
  var errmess = 'Unknown sender. '
  return b.blocktree.isNameAvail(senderDiv.value).then(avail => {
    if (avail !== false) {
      setError(errmess)
    } else {
      unsetError(errmess)
    }
    return (avail === false)
  }).catch(e => {
    setError(errmess)
    return false
  })
}

function validateRecipient () {
  recDiv = recDiv || document.getElementById('guld_transaction_recipient')
  var errmess = 'Unknown recipient. '
  return b.blocktree.isNameAvail(recDiv.value).then(avail => {
    if (avail !== false) {
      setError(errmes)
    } else {
      unsetError(errmess)
    }
    return (avail === false)
  }).catch(e => {
    setError(errmess)
    return false
  })
}

function validateSpendAmount () {
  amtDiv = amtDiv || document.getElementById('guld_spend_amount')
  amount = new b.Decimal(amtDiv.value)
  var errmess = 'Invalid amount. '
  if (amount.greaterThan(balance)) {
    setError(errmess)
    return false
  } else {
    unsetError(errmess)
    return true
  }
}

function detectCommodity () {
  if (window.location.href.indexOf("/gg/") >= 0) commodity = 'GG'
}
