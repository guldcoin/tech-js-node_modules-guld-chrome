const curl = require('./curl.js')
const {showBalances} = require('./components/balances.js')

async function setupPage () {
  var page = detectPage()
  if (page !== 'options' && (!this.observer.name || this.observer.name === 'guld' || this.hosts.length === 0 || !this.hosts[0].name)) {
    window.location = `chrome-extension://${chrome.runtime.id}/src/index.html?view=options`
  }
  detectCommodity()
  return loadHTML('currency-tab').then(() => {
    document.body.id = self.commodity.toLowerCase()
    var el = document.getElementById(`${self.commodity.toLowerCase()}-tab`)
    if (el) el.setAttribute('class', 'active')
    return loadHTML('header-wrapper').then(showPage).then(showBalances).then(showTransactionTypes)
  })
}

function getCachedDiv (cache, div) {
  if (typeof cache === 'undefined') cache = document.getElementById(div)
  return cache
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
  window.currentPage = qs.view || 'dash'
  return window.currentPage
}

function detectCommodity (qs) {
  qs = qs || parseQS()
  self.commodity = qs.commodity || 'GULD'
  return self.commodity
}

async function showPage (page) {
  page = page || detectPage()
  if (page !== 'options') {
    var logout = document.getElementById('logout')
    logout.addEventListener('click', logout)
    logout.style.display = 'block'
    document.getElementById('balance-div').style.display = 'block'
    document.getElementById('header-menu').style.display = 'block'
    document.getElementById('currency-tab').style.display = 'block'
    document.getElementById('settings').style.display = 'block'
  }

  await loadHTML(page, 'content')
  var el = document.getElementById(page)
  if (el) el.setAttribute('class', 'active')
  var hnav = document.getElementById('header-nav')
  for (var i = 0; i < hnav.children.length; i++) {
    hnav.children[i].href = hnav.children[i].href.replace(/(GULD|BTC|GG)/, self.commodity)
  }
}

async function loadHTML (component, eid) {
  eid = eid || component
  if (['currency-tab', 'header-wrapper'].indexOf(component) >= 0) {
    document.getElementById(eid).innerHTML = await curl(`/src/components/${component}.html`)
  } else {
    document.getElementById(eid).innerHTML = await curl(`/src/views/${component}.html`)
  }
}

function setDisplay (t) {
  tab = t
  Object.keys(DIVS[tab]).forEach(div => {
    var el = document.getElementById(div)
    if (el) {
      if (DIVS[tab][div]) el.style.display = 'block'
      else if (DIVS[tab][div] === false) el.style.display = 'none'
      else if (div === 'err-warn') el.innerHTML = DIVS[tab][div]
    }
  })
}

module.exports = {
  setDisplay: setDisplay,
  loadHTML: loadHTML,
  showPage: showPage,
  setupPage: setupPage,
  getCachedDiv: getCachedDiv,
  showTransactionTypes: showTransactionTypes,
  parseQS: parseQS,
  detectPage: detectPage,
  detectCommodity: detectCommodity
}
