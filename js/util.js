/* global chrome:false */

var b
var errdiv

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
  errdiv.innerHTML = `${errmess}${errdiv.innerHTML}`
}

function unsetError (errmess) { // eslint-disable-line no-unused-vars
  errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
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
  window.location = `chrome-extension://${chrome.runtime.id}/options.html`
}

function showBalances (gname, commodity) {
  gname = gname || b.guldname
  commodity = commodity || 'GULD'
  var balDiv = document.getElementById('balance')
  var usdValDiv = document.getElementById('usd-value')
  function setUSD (dec) {
    usdValDiv.innerHTML = `~ ${dec.toString()} USD`
  }
  if (balDiv && usdValDiv) {
    b.getBalance(gname, true).then(bal => {
      if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
        balDiv.innerHTML = `${bal.Assets.__bal[commodity].value.toString()} ${commodity}`
        b.blocktree.getPrice('GULD', '$').then(p => {
          if (commodity === 'GULD') setUSD(bal.Assets.__bal.GULD.value.mul(p.value))
          else {
            b.blocktree.getPrice(commodity, 'GULD').then(pp => {
              setUSD(bal.Assets.__bal[commodity].value.mul(p.value).mul(pp.value))
            }).catch(e => {
              console.error(e)
              setUSD (new b.Decimal(0))
            })
          }
        })
      }
    })
  }
}
