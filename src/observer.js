const {Observer} = require('guld-lib')
const apps = require('./apps/apps.js')
const hosts = require('./hosts/hosts.js')

class AppObserver extends Observer {
  constructor(config) {
    super(config)
  }

  get manifest () {
    if (!(this._manifest)) this._manifest = chrome.runtime.getManifest()
    return this._manifest
  }

  async logout (e) {
    if (e && e.preventDefault) e.preventDefault()
    window.location = `chrome-extension://${chrome.runtime.id}/src/index.html?view=options`
  }

  async loadGuldVals () {
    var gnameDiv = document.getElementById('guldname-new')
    if (this.observer.name !== 'guld' && gnameDiv) gnameDiv.value = this.observer.name
    var fullnameDiv = document.getElementById('fullname-new')
    if (fullnameDiv) fullnameDiv.value = this.observer.fullname
    var gmailDiv = document.getElementById('guldmail')
    if (gmailDiv) gmailDiv.value = this.observer.mail
    var gfprDiv = document.getElementById('guldfpr')
    if (gfprDiv) gmailDiv.value = this.observer.fpr
    return this.observer
  }
}

module.exports = AppObserver
