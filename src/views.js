module.exports.setupPage = () => {
  return getBackground().then((b) => {
    var page = detectPage()
    if (page !== 'options' && (!b.guldname || b.guldname === 'guld' || !b.ghoauth || b.ghoauth.length === 0)) {
      window.location = `chrome-extension://${chrome.runtime.id}/html/main.html?view=options`
    }
    detectCommodity()
    return loadHTML('currency-tab').then(() => {
      document.body.id = self.commodity.toLowerCase()
      var el = document.getElementById(`${self.commodity.toLowerCase()}-tab`)
      if (el) el.setAttribute('class', 'active')
      return loadHTML('header-wrapper').then(showPage).then(showBalances).then(showTransactionTypes)
    })
  })
}

module.exports.showTransactionTypes = (page, comm) => {
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

module.exports.parseQS = () => {
  var args = {}
  window.location.search.replace('?', '').split('&').forEach(v => {
    var val = v.split('=')
    args[val[0]] = val[1]
  })
  return args
}

module.exports.detectPage = (qs) => {
  qs = qs || parseQS()
  window.currentPage = qs.view || 'dash'
  return window.currentPage
}

module.exports.detectCommodity = (qs) => {
  qs = qs || parseQS()
  self.commodity = qs.commodity || 'GULD'
  return self.commodity
}

module.exports.showPage = (page) => {
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

  return loadHTML(page, 'content').then(() => {
    var el = document.getElementById(page)
    if (el) el.setAttribute('class', 'active')
    var hnav = document.getElementById('header-nav')
    for (var i = 0; i < hnav.children.length; i++) {
      hnav.children[i].href = hnav.children[i].href.replace(/(GULD|BTC|GG)/, self.commodity)
    }
  })
}

module.exports.loadHTML = (component, eid) => {
  eid = eid || component
  return getBackground().then((b) => {
    return b.curl(`/html/${component}.html`).then(content => {
      document.getElementById(eid).innerHTML = content
    })
  })
}

module.exports.setDisplay = (t) => {
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

