'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false GitHub:false FOOTER_TEMPLATE:false b:false gh:true OAUTH_TOKEN:true USER:true wrapper:false myKey:true ghOAUTH:true */

const GH_TEMPLATE =
    `${LOGO_TEMPLATE}
  <form id="name-selection-form">

  <div class="row">
    <input type="text" id="gh-username" placeholder="github username"></input><br>
  </div>

  <div class="row">
    <input type="text" id="guld-name" placeholder="guld username"></input><br>
  </div>
  ${ERR_TEMPLATE}

  <div class="row">
    <button type="submit" value="store">Save</button>
  </div>
</form>  
${FOOTER_TEMPLATE}`

function initGitHub () {
  gh = new GitHub({token: OAUTH_TOKEN})
  var guser = gh.getUser()
  return guser.getProfile().then(profile => {
    USER = profile.data.login
    AVATAR_URL = profile.data.avatar_url
    return USER
  })
}

function loadGithub (err) { // eslint-disable-line no-unused-vars
  // Load view
  wrapper.innerHTML = GH_TEMPLATE
  var guldn = document.getElementById('guld-name')
  var errdiv = document.getElementById('err-div')
  var nsf = document.getElementById('name-selection-form')
  nsf.addEventListener('submit', submitGithub)

  var presubmit = () => {
    if (errdiv.innerHTML.indexOf('Guld name is not available or available, choose another.') > -1) { errdiv.innerHTML = errdiv.innerHTML.replace(/Guld name is not available or available, choose another./g, '') }
  }

  var ghInit = () => {
    return initGitHub().then(() => {
      var ghn = document.getElementById('gh-username')
      ghn.value = USER
      ghn.disabled = true
      if (!guldn.value || guldn.value.length === 0) {
        guldn.value = ghn.value
        return checkGName()
      } else return
    })
  }

  var checkGName = () => {
    if (!b.blocktree || !b.blocktree.initialized) return Promise.resolve(false)
    return b.blocktree.isNameAvail(guldn.value).then(avail => {
      if (avail) {
        presubmit()
      } else {
        if (errdiv.innerHTML.indexOf('Guld name is not available or valid, choose another.') === -1) { errdiv.innerHTML = `${errdiv.innerHTML} Guld name is not available or available, choose another.` }
        guldn.focus()
        guldn.select()
      }
      return avail
    }).catch(error => {
      errdiv.innerHTML = `${errdiv.innerHTML} ${error}`
    })
  }

  Promise.all([
    new Promise((resolve, reject) => {
      if (!b.blocktree || !b.blocktree.initialized) {
        var errmess = 'Still loading blocktree. '
        err += errmess
        b.blocktree.on('initialized', (e) => {
          errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
          guldn.addEventListener('focusout', checkGName)
          resolve()
        })
      } else {
        guldn.addEventListener('focusout', checkGName)
        resolve()
      }
    }),
    new Promise((resolve, reject) => {
      if (typeof myKey === 'undefined') {
        var errmess = 'Still generating keys. '
        err += errmess
      }
      wrapper.addEventListener('mykey-ready', function (e) {
        errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
        resolve()
      }, false)
    }),
    new Promise((resolve, reject) => {
      if (typeof ghcreds === 'undefined') {
        var errmess = 'Git host authentication is required. '
        err += errmess
        ghOAUTH().catch(reject)
        wrapper.addEventListener('oauth-ready', function (e) {
          errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
          ghInit().then(resolve)
        }, false)
      } else ghInit().then(resolve)
    })
  ]).then(() => {
    presubmit()
  })

  // Hidding menu if settings are not saved
  chrome.storage.local.get('gh', function (data) {
    if (typeof data.gh === 'undefined') {
      document.getElementById('footer_menu').innerHTML = ''
    }
  })

  function submitGithub (e) {
    checkGName().then(avail => {
      if (avail === false) {
        return
      }
      e.preventDefault()
      nsf.disabled = true
      var options = {
        data: JSON.stringify({
          oauth: OAUTH_TOKEN,
          username: USER
        }),
        publicKeys: keyring.publicKeys.getForId(myKey.primaryKey.fingerprint),
        privateKeys: [myKey]
      }
      openpgp.encrypt(options).then(function (ciphertext) {
        var encrypted = ciphertext.data
        chrome.storage.local.set({
          gh: encrypted
        }, routes('dash', ''))
      })
    })
  }

  load(err)
}
