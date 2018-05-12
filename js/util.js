/* global chrome:false */

var b
var errdiv
var commodity = 'GULD'
var balance = new Decimal(0)
var amount = new Decimal(0)
var currentPage
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
    window.location = `chrome-extension://${chrome.runtime.id}/html/options.html`
  }
  document.getElementById('logout').addEventListener('click', logout)
  detectCommodity()
  return loadHTML('currency-tab').then(() => {
    document.body.id = commodity.toLowerCase();
    var el = document.getElementById(`${commodity.toLowerCase()}-tab`)
    if (el) el.setAttribute('class', 'active')
    return loadHTML('header-wrapper').then(showPage).then(showBalances).then(showTransactionTypes)
  })
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
  window.location = `chrome-extension://${chrome.runtime.id}/html/options.html`
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

function showBalances (gname, comm) {
  comm = comm || commodity
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
}

function showTransactionTypes (page, comm) {
  page = page || detectPage()
  comm = comm || detectCommodity()
  ttypes = {
    'GULD': ['send', 'register', 'grant'],
    'GG': ['send', 'burn'],
    'BTC': ['deposit', 'convert']
  }
  if (ttypes[comm]) {
    ttypes[comm].forEach(ttype => {
      document.getElementById(ttype).style.display = 'inline-block'
    })
  }
}

function validateSender () {
  senderDiv = senderDiv || document.getElementById('guld-transaction-sender')
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
  recDiv = recDiv || document.getElementById('guld-transaction-recipient')
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
  amtDiv = amtDiv || document.getElementById('guld-spend-amount')
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

function parseQS () {
  var args = {}
  window.location.search.replace('?', '').split('&').forEach(v => {
    var val = v.split('=')
    args[val[0]] = val[1]
  })
  return args
}

function detectPage (qs) {
  qs = qs || parseQS()
  currentPage = qs.view || 'dash'
  return currentPage
}

function detectCommodity (qs) {
  qs = qs || parseQS()
  commodity = qs.commodity || 'GULD'
  return commodity
}

function showPage (page) {
  page = page || detectPage()
  return loadHTML(page, 'content').then(() => {
    var el = document.getElementById(page)
    if (el) el.setAttribute('class', 'active')
    var hnav = document.getElementById('header-nav')
    for (var i = 0; i < hnav.children.length; i++) {
      hnav.children[i].href = hnav.children[i].href.replace(/(GULD|BTC|GG)/, commodity)
    }
  })
}

function loadHTML (component, eid) {
  eid = eid || component
  return b.curl(`/html/${component}.html`).then(content => {
    document.getElementById(eid).innerHTML = content
  })
}
