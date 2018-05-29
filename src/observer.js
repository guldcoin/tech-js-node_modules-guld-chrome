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
    var data = await b.getGuldID()
    if (b.guldname !== 'guld') document.getElementById('guldname-new').value = b.guldname
    document.getElementById('fullname-new').value = b.fullname
    document.getElementById('guldmail').value = b.guldmail
    document.getElementById('guldfpr').value = b.guldfpr
    return data
  }
}

module.exports = AppObserver
