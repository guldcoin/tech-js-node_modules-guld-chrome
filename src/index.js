const AppObserver = require('./observer.js')
const views = require('./views.js')
const {github} = require('./hosts/hosts.js')
const balances = require('./components/balances.js')
const validate = require('./validate.js')
const error = require('./components/error.js')
const loading = require('./components/loading.js')

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
  global = await AppObserver.getGlobal()
  global.observer.curl = require('./curl.js').bind(global.observer)
  for (var v in views) {
    global.observer[v] = views[v].bind(global.observer)
  }
  for (var v in validate) {
    global.observer[v] = validate[v].bind(global.observer)
  }
  for (var v in balances) {
    global.observer[v] = balances[v].bind(global.observer)
  }
  for (var v in error) {
    global.observer[v] = error[v].bind(global.observer)
  }
  for (var v in loading) {
    global.observer[v] = loading[v].bind(global.observer)
  }
  global.observer.hosts = global.observer.hosts || {}
  global.observer.hosts.github = global.observer.hosts.github || {}
  global.observer.hosts.github.auth = global.observer.hosts.github.auth || {}
  for (var v in github) {
    global.observer.hosts.github[v] = github[v].bind(global.observer)
  }
  await global.observer.setupPage()
  switch (global.observer.detectPage()) {
    case 'dash':
      global.observer.loadWallet()
      break
    case 'send':
      global.observer.loadSend()
      break
    case 'register':
      global.observer.loadRegister()
      break
    case 'grant':
      global.observer.loadGrant()
      break
    case 'burn':
      global.observer.loadBurn()
      break
    case 'convert':
      global.observer.loadConvert()
      break
    case 'deposit':
      global.observer.loadDeposit()
      break
    case 'options':
    default:
      global.observer.loadOptions()
      break
  }
})
