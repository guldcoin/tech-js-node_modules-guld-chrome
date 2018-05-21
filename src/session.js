const openpgp = require('openpgp')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('../../js-guld-lib/guld-lib.js')
const { Ledger } = require('../../ledger-cli/ledger.js')
const { Amount, Balance, Account } = require('../../ledger-types/types.js')
const flexfs = require('flexfs')
const commodities = require('./commodities/commodities.js')
const apps = require('./apps/apps.js')
const hosts = require('./hosts/hosts.js')

module.export = class AppSession extends Session {
  constructor(fs) {
    this.fs = fs | require('fs')
//    this._keyid = keyid
  }

  init () {
    await flexfs()
    await getGuldID()
    await self.bootstrapBlocktree()
  }

  get keyring () {
    if (!(this._keyring)) this._keyring = new openpgp.Keyring()
    return this._keyring
  }

  get manifest () {
    if (!(this._manifest)) this._manifest = chrome.runtime.getManifest()
    return this._manifest
  }

  async logout (e) {
    if (e && e.preventDefault) e.preventDefault()
    window.location = `chrome-extension://${chrome.runtime.id}/html/main.html?view=options`
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

