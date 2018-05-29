const AppObserver = require('./observer.js')
const views = require('./views.js')
const balances = require('./components/balances.js')

const NAMEWARN = 'Guld name is not available or valid, choose another.'
var guldnameDiv
var guldmailDiv
var errdiv
var passin
var passrin
var expertMode = false
var emodel
var mainurl = `chrome-extension://${chrome.runtime.id}/src/index.html`
var tab = 'login'
var global

document.addEventListener('DOMContentLoaded', async function () {
  var global = await AppObserver.getGlobal()
  for (var v in views) {
    global.observer[v] = views[v]
  }
  for (var v in balances) {
    global.observer[v] = balances[v]
  }
  await global.observer.setupPage()
  switch (global.observer.detectPage()) {
    case 'dash':
      loadWallet()
      break
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
    case 'options':
    default:
      loadOptions()
      break
  }
})
