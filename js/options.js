const NAMEWARN = 'Guld name is not available or valid, choose another.'
var guldnameDiv
var guldmailDiv
var passin
var passrin
var expertMode = false
var emodel
var mainurl = `chrome-extension://${chrome.runtime.id}/main.html`

function loadOptions () { // eslint-disable-line no-unused-vars
  emodel.addEventListener('click', toggleExpertMode)
  loadGithub()
  loadGuldVals()
  if (b.keyring.privateKeys.keys.length > 0) {
    document.getElementById('create-submit-div').style.display = "none"
    document.getElementById('key-passphrase-repeat-div').style.display = "none"
    document.getElementById('fullname-div').style.display = "none"
    document.getElementById('guldmail-div').style.display = "none"
    document.getElementById('expert-mode-div').style.display = "none"
    document.getElementById('login-submit').addEventListener('click', submitLogin)
    document.getElementById('err-warn').innerHTML = 'Please unlock your key.'
  } else {
    document.getElementById('login-submit-div').style.display = "none"
    document.getElementById('create-submit').addEventListener('click', submitCreate)
  }
}

function loadGuldVals () {
  return b.getGuldID().then(() => {
    if (b.guldname !== 'guld') document.getElementById('guldname').value = b.guldname
    document.getElementById('fullname').value = b.fullname
    document.getElementById('guldmail').value = b.guldmail
    document.getElementById('guldfpr').value = b.guldfpr
  })
}

function loadGithubVals () {
  return b.initGitHub().then(() => {
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

function setupGHKey () {
  if (!b.ghkeyid || b.ghkeyid.length == 0) {
    return b.curl(`https://api.github.com/user/gpg_keys`,
      {
        'method': 'POST',
        'body': JSON.stringify({'armored_public_key': b.keyring.publicKeys.getForId(b.guldfpr).armor()})
      }
    )
  } else return
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
  if (emodel && emodel.checked) expertMode = true
  else expertMode = false
}

function submitLogin (e) {
  e.preventDefault()
  var myKey = b.keyring.privateKeys.getForId(b.guldfpr)
  if (myKey.primaryKey.isDecrypted) {
    window.location = `chrome-extension://${chrome.runtime.id}/main.html`
  } else {
    myKey.decrypt(passin.value).then(() => {
      window.location = `chrome-extension://${chrome.runtime.id}/main.html`
    })
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
        b.fullname = document.getElementById('fullname').value
        if (fullname.length === 0) fullname = guldname
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
            b.setGuldID().then(setupGHKey).then(() => {
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
    else if (errdiv.innerHTML.indexOf(NAMEWARN) == -1 && b.keyring.privateKeys.keys.length === 0) setError(NAMEWARN)
    return avail
  }).catch(error => {
    setError(NAMEWARN)
    return false
  })
}

document.addEventListener('DOMContentLoaded', function () {
  guldnameDiv = document.getElementById('guldname')
  errdiv = document.getElementById('err-div')
  guldnameDiv.addEventListener('focusout', checkGName)
  passin = document.getElementById('key-passphrase')
  passrin = document.getElementById('key-passphrase-repeat')
  emodel = document.getElementById('expert-mode')

  loadBackground().then(loadOptions)
})
