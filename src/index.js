'use strict'

/* global b:false logout:false */
//const { logout, setError, unsetError, loadBackground, getBackground, detectPage, setupPage, getBalances, showBalances, validateSender, validateRecipient, validateSpendAmount } = require('./util.js')
const { Decimal } = require('decimal.js')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('../../js-guld-lib/guld-lib.js')
const { Amount, Balance, Account } = require('../../ledger-types/types.js')

const NAMEWARN = 'Guld name is not available or valid, choose another.'
var guldnameDiv
var guldmailDiv
var errdiv
var passin
var passrin
var expertMode = false
var emodel
var mainurl = `chrome-extension://${chrome.runtime.id}/html/main.html`
var tab = 'login'
var b
document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(getBackground).then(bkg => {
    b = bkg
  }).then(setupPage).then(() => {
    switch (detectPage()) {
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
})
