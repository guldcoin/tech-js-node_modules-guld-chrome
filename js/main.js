'use strict'

/* global b:false logout:false */
const { logout, setError, unsetError, loadBackground, getBackground, detectPage, setupPage, getBalances, showBalances, validateSender, validateRecipient, validateSpendAmount } = require('./util.js')
const { Decimal } = require('decimal.js')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('guld-lib')
const { Amount, Balance, Account } = require('ledger-types')

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

const DIVS = {
  'login': {
    'key-create-radio-div': false,
    'guldfpr-div': true,
    'key-import-div': false,
    'guldname-div': true,
    'fullname-div': false,
    'guldmail-div': false,
    'key-passphrase-div': true,
    'key-passphrase-repeat-div': false,
    'expert-mode-div': false,
    'unlock-submit-div': true,
    'import-submit-div': false,
    'export-submit-div': false,
    'create-submit-div': false,
    'err-warn': 'Please unlock your key.'
  },
  'import': {
    'key-create-radio-div': true,
    'guldfpr-div': false,
    'key-import-div': true,
    'guldname-div': true,
    'fullname-div': false,
    'guldmail-div': false,
    'key-passphrase-div': true,
    'key-passphrase-repeat-div': false,
    'expert-mode-div': true,
    'unlock-submit-div': false,
    'import-submit-div': true,
    'export-submit-div': false,
    'create-submit-div': false,
    'err-warn': ''
  },
  'loggedin': {
    'key-create-radio-div': false,
    'guldfpr-div': true,
    'key-import-div': false,
    'guldname-div': true,
    'fullname-div': false,
    'guldmail-div': false,
    'key-passphrase-div': false,
    'key-passphrase-repeat-div': false,
    'expert-mode-div': true,
    'unlock-submit-div': false,
    'import-submit-div': false,
    'export-submit-div': true,
    'create-submit-div': false,
    'err-warn': ''
  },
  'generate': {
    'key-create-radio-div': true,
    'guldfpr-div': false,
    'key-import-div': false,
    'guldname-div': true,
    'fullname-div': true,
    'guldmail-div': true,
    'key-passphrase-div': true,
    'key-passphrase-repeat-div': true,
    'expert-mode-div': true,
    'unlock-submit-div': false,
    'import-submit-div': false,
    'export-submit-div': false,
    'create-submit-div': true,
    'err-warn': 'WARNING: Everything except your passphrase is public!'
  }
}

function loadOptions () {
  setDisplay('login')
  guldnameDiv = document.getElementById('guldname-new')
  guldmailDiv = document.getElementById('guldmail')
  errdiv = document.getElementById('err-div')
  if (guldnameDiv)
    guldnameDiv.addEventListener('focusout', checkGName)
  passin = document.getElementById('key-passphrase')
  passrin = document.getElementById('key-passphrase-repeat')
  emodel = document.getElementById('expert-mode')
  document.getElementById('logout').addEventListener('click', logout)
  var ghavatarDiv = document.getElementById('ghavatar')
  if (ghavatarDiv) {
    ghavatarDiv.addEventListener('click', e => {
      b.ghoauth = ''
      loadGithub()
    })
  }
  document.getElementById('key-create-radio-import').addEventListener('click', e => {
    setDisplay('import')
  })
  document.getElementById('key-create-radio-generate').addEventListener('click', e => {
    setDisplay('generate')
  })
  emodel.addEventListener('click', toggleExpertMode)
  document.getElementById('login-submit').addEventListener('click', submitLogin)
  document.getElementById('create-submit').addEventListener('click', submitCreate)
  document.getElementById('import-submit').addEventListener('click', submitImport)

  loadGuldVals().then(loadGithub).then(() => {
    if (b.keyring.privateKeys.keys.length > 0) {
      if (b.guldfpr && b.guldfpr.length > 0) {
        var myKey = b.keyring.privateKeys.getForId(b.guldfpr)
        if (myKey && myKey.primaryKey.isDecrypted === false) {
          document.getElementById('err-warn').innerHTML = 'Please unlock your key.'
          setDisplay('login')
        } else {
          setDisplay('loggedin')
        }
      }
    } else setDisplay('generate')
  }).catch(setError)
}

function loadWallet () {
  var usdVal = new Decimal(0)
  var usdTotalValDiv = document.getElementById('total-usd-value')
  showBalances(b.guldname, 'GULD')
  getBalances(b.guldname, 'GULD').then(bals => {
    document.getElementById('guld-balance').innerHTML = `${bals[0].toString()} GULD`
    usdVal = usdVal.plus(bals[1].toString())
    usdTotalValDiv.innerHTML = `~ ${usdVal.toDecimalPlaces(2).toString()} USD`
    getBalances(b.guldname, 'GG').then(bals => {
      document.getElementById('gg-balance').innerHTML = `${bals[0].toString()} GG`
      usdVal = usdVal.plus(bals[1].toString())
      usdTotalValDiv.innerHTML = `~ ${usdVal.toDecimalPlaces(2).toString()} USD`
    })
  })
}

function loadSend () {
  window.senderDiv = document.getElementById('guld-transaction-sender')
  window.recDiv = document.getElementById('guld-transaction-recipient')
  window.amtDiv = document.getElementById('guld-spend-amount')
  var formEl = document.getElementById('guld-transfer-form')
  window.senderDiv.value = b.guldname

  b.getBalance().then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      amtDiv.max = bal.Assets.__bal[commodity].value.toString()
      window.balance = bal.Assets.__bal[commodity].value
    }
  })

  window.senderDiv.addEventListener('focusout', validateSender)
  window.recDiv.addEventListener('focusout', validateRecipient)
  window.amtDiv.addEventListener('change', validateSpendAmount)
  formEl.addEventListener('submit', e => {
    e.preventDefault()
    document.body.className = document.body.className + ' loading'
    if (validateSpendAmount()) {
      validateSender().then(valid => {
        if (valid) {
          validateRecipient().then(valid => {
            if (valid) {
              var time = Math.trunc(Date.now() / 1000)
              var tx = Transfer.create(window.senderDiv.value, window.recDiv.value, window.amtDiv.value, commodity, time)
              b.writeTx(tx, b.guldname, commodity, window.senderDiv.value, time).then(() => {
                window.location = `chrome-extension://${chrome.runtime.id}/html/main.html`
              }).catch(err => {
                document.body.className = document.body.className.replace(' loading', '')
                setError(err)
              })
            } else document.body.className = document.body.className.replace(' loading', '')
          })
        } else document.body.className = document.body.className.replace(' loading', '')
      })
    } else document.body.className = document.body.className.replace(' loading', '')
  })
}

function loadRegister () {
  var regTypeDiv = document.getElementById('guld-registration-type')
  var nameDiv = document.getElementById('guld-registration-name')
  amtDiv = document.getElementById('guld-spend-amount')
  var formEl = document.getElementById('registration-form')

  b.getBalance().then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      amtDiv.max = bal.Assets.__bal[commodity].value.toString()
      window.balance = bal.Assets.__bal[commodity].value
    }
  })

  b.isRegistered(b.guldname).then(registered => {
    if (registered) regTypeDiv.value = 'group'
    else {
      regTypeDiv.value = 'individual'
      b.blocktree.getPrice('GULD', '$').then(price => {
        setError(`Everyone has to register on the guld group before being able to send or contract. The cost is currently 0.1 GULD or ~$${price.value.mul(0.1)}. Please click 'register' to continue.`)
        amtDiv.value = 0.1
        amtDiv.disabled = true
        nameDiv.value = b.guldname
        nameDiv.disabled = true
      })
    }
  })

  formEl.addEventListener('submit', e => {
    e.preventDefault()
    if (validateSpendAmount()) {
      validateSender().then(valid => {
        if (valid) {
          validateRecipient().then(valid => {
            if (valid) {
              var time = Math.trunc(Date.now() / 1000)
              var tx = Register.create(nameDiv.value, regTypeDiv.value, (new Decimal(10)).mul(amtDiv.value).toNumber(), commodity, b.guldname, time)
            }
          })
        }
      })
    }
  })
}

function loadDeposit () {
  new QRCode(document.getElementById("qrcode"), "http://guld.io")
}

function loadGrant () {
  setupPage()
}

function loadConvert () {
}

function loadBurn () {
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

function loadGuldVals () {
  return b.getGuldID().then(data => {
    if (b.guldname !== 'guld') document.getElementById('guldname-new').value = b.guldname
    document.getElementById('fullname-new').value = b.fullname
    document.getElementById('guldmail').value = b.guldmail
    document.getElementById('guldfpr').value = b.guldfpr
    return data
  })
}

function loadGithubVals () {
  return b.initGitHub().then(() => {
    document.getElementById('gh-login-div').style.display = 'none'
    document.getElementById('ghavatar-div').style.display = 'block'
    document.getElementById('ghavatar').src = b.ghavatar
    if (b.ghmail && b.ghmail.length > 0 &&
        (!guldmailDiv.value ||
         guldmailDiv.value.length === 0)) {
      guldmailDiv.value = b.ghmail
    }
    if (b.ghname && b.ghname.length > 0 && (!guldnameDiv.value || guldnameDiv.value.length === 0)) {
      guldnameDiv.value = b.ghname
      return checkGName()
    } else return true
  })
}

function loadGithub () {
  if (b.ghoauth.length === 0) {
    var errmess = 'Git host authentication is required. '
    setError(errmess)
    return b.ghOAUTH().then(token => {
      unsetError(errmess)
      return loadGithubVals()
    })
  } else return loadGithubVals()
}

function toggleExpertMode () {
  if (emodel && emodel.checked) {
    expertMode = true
    document.getElementById('export-submit-private').style.display = 'block'
  } else {
    document.getElementById('export-submit-private').style.display = 'none'
    expertMode = false
  }
}

function submitLogin (e) {
  e.preventDefault()
  var myKey = b.keyring.privateKeys.getForId(b.guldfpr)
  if (myKey.primaryKey.isDecrypted) {
    window.location = mainurl
  } else {
    myKey.decrypt(passin.value).then(() => {
      window.location = mainurl
    }).catch(setError)
  }
}

function validatePass () {
  var errmess = 'Password invalid or does not match. '
  var same = (passin.value === passrin.value)
  if (same !== true) setError(errmess)
  else unsetError(errmess)
  return same
}

function submitCreate (e) {
  e.preventDefault()
  if (validatePass()) {
    checkGName().then(avail => {
      if (avail || expertMode) {
        b.guldname = guldnameDiv.value
        b.fullname = document.getElementById('fullname-new').value
        if (b.fullname.length === 0) b.fullname = b.guldname
        b.guldmail = document.getElementById('guldmail').value
        var options = {
          numBits: 4096,
          userIds: [{
            name: b.fullname,
            email: b.guldmail
          }],
          passphrase: passin.value
        }
        var errmess = 'Generating keys, please wait. '
        setError(errmess)
        b.openpgp.generateKey(options).then(function (key) {
          b.keyring.publicKeys.importKey(key.publicKeyArmored)
          b.keyring.privateKeys.importKey(key.privateKeyArmored)
          b.guldfpr = key.key.primaryKey.fingerprint
          b.keyring.store()
          key.key.decrypt(passin.value).then(() => {
            unsetError(errmess)
            b.setGuldID()
              .then(b.setupGHKey)
              .then(finishLocalSignup)
              .then(() => {
                finishLocalSignup()
                window.location = mainurl
              })
          })
        })
      }
    })
  }
}

function checkGName () {
  return b.blocktree.isNameAvail(guldnameDiv.value).then(avail => {
    if (avail && errdiv.innerHTML.indexOf(NAMEWARN) > -1) unsetError(NAMEWARN)
    else if (errdiv.innerHTML.indexOf(NAMEWARN) === -1 && b.keyring.privateKeys.keys.length === 0) setError(NAMEWARN)
    return avail
  }).catch(() => {
    setError(NAMEWARN)
    return false
  })
}

function submitImport (e) {
  e.preventDefault()
  b.keyring.privateKeys.importKey(document.getElementById('key-import').value).then(err => {
    if (err) setError(err)
    else {
      b.keyring.store()
      b.keyring.privateKeys.keys[0].decrypt(passin.value).then(() => {
        b.keyring.publicKeys.importKey(b.keyring.privateKeys.keys[0].toPublic().armor()).then(() => {
          b.guldname = guldnameDiv.value
          b.guldfpr = b.keyring.privateKeys.keys[0].primaryKey.fingerprint
          if (b.keyring.privateKeys.keys[0].users.length > 0) {
            var userid = b.keyring.privateKeys.keys[0].users[0].userId.userid
            var uida = userid.replace('>', '').split('<')
            b.fullname = uida[0].trim()
            b.guldmail = uida[1].trim()
          }
          b.blocktree.mapNamesToFPR([b.guldfpr]).then(names => {
            if (names.length === 1) b.guldname = names[0]
            finishLocalSignup()
          }).catch(e => {
            finishLocalSignup()
          })
        }).catch(setError)
      }).catch(setError)
    }
  })
}

function finishLocalSignup () {
  return b.setupGHKey()
    .then(b.renameBlocktree)
    .then(b.forkGuld)
    .then(b.bootstrapBlocktree)
    .then(b.setGH)
    .then(b.setGuldID)
    .then(b.redirectAllRemotes)
    .then(() => {
      window.location = mainurl
    }).catch(console.error)
}


document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(getBackground).then(bkg => {
    b = bkg
  }).then(setupPage).then(() => {
    switch(detectPage()) {
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
