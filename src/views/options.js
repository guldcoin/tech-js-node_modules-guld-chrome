
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

module.exports.loadOptions = () => {
  setDisplay('login')
  document.getElementById('loading-div').style.display = 'none'
  guldnameDiv = document.getElementById('guldname-new')
  guldmailDiv = document.getElementById('guldmail')
  errdiv = document.getElementById('err-div')
  if (guldnameDiv) { guldnameDiv.addEventListener('focusout', checkGName) }
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

module.exports.submitLogin = (e) => {
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

module.exports.submitCreate = (e) => {
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

module.exports.submitImport = (e) => {
  e.preventDefault()
  document.getElementById('loading-div').style.display = 'block'
  b.keyring.privateKeys.importKey(document.getElementById('key-import').value).then(err => {
    if (err) setErrorNotLoading(err)
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
        }).catch(setErrorNotLoading)
      }).catch(setErrorNotLoading)
    }
  })
}

module.exports.finishLocalSignup = () => {
  return b.setupGHKey()
    .then(b.renameBlocktree)
    .then(b.forkGuld)
    .then(b.bootstrapBlocktree)
    .then(b.setGH)
    .then(b.setGuldID)
    .then(b.redirectAllRemotes)
    .then(() => {
      document.getElementById('loading-div').style.display = 'none'
      window.location = mainurl
    }).catch(setErrorNotLoading)
}

module.exports.toggleExpertMode = () => {
  if (emodel && emodel.checked) {
    expertMode = true
    document.getElementById('export-submit-private').style.display = 'block'
  } else {
    document.getElementById('export-submit-private').style.display = 'none'
    expertMode = false
  }
}
