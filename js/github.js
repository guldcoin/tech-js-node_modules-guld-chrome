'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false GitHub:true FOOTER_TEMPLATE:false */

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


function loadGithub (err) { // eslint-disable-line no-unused-vars
  // Load view
  wrapper.innerHTML = GH_TEMPLATE
  var guldn = document.getElementById('guld-name')
  var errdiv = document.getElementById('err-div')
  var nsf = document.getElementById('name-selection-form')
  nsf.addEventListener('submit', submitGithub)

  var presubmit = () => {
    nsf.disabled = true
    if (errdiv.innerHTML.indexOf('Guld name is not available or available, choose another.') > -1)
          errdiv.innerHTML = errdiv.innerHTML.replace(/Guld name is not available or available, choose another./g, '')
  }

  var ghInit = (done) => {
    gh = new GitHub({username: OAUTH_TOKEN, token: OAUTH_TOKEN})
    var me = gh.getUser()
    me.getProfile().then(profile => {
      if (profile && profile.data) {
        var ghn = document.getElementById('gh-username')
        ghn.value = profile.data.login
        USER = ghn.value
        ghn.disabled = true
        if (!guldn.value || guldn.value.length == 0) {
          guldn.value = ghn.value
          checkGName()
        }
      }
      done()
    })
  }

  var checkGName = () => {
    return blocktree.isNameAvail(guldn.value).then(avail => {
      if (avail) {
        presubmit()
      } else {
        if (errdiv.innerHTML.indexOf('Guld name is not available or available, choose another.') == -1)
          errdiv.innerHTML = `${errdiv.innerHTML} Guld name is not available or available, choose another.`
        guldn.focus()
        guldn.select()
        nsf.disabled = true
      }
      return Promise.resolve(avail)
    }).catch(err => {
      errdiv.innerHTML = `${errdiv.innerHTML} ${err}`
    })
  }

  var gInit = (done) => {
    guldn.addEventListener('focusout', checkGName)
    done()
  }

  Promise.all([
    new Promise((resolve, reject) => {
      if (!blocktree.initialized) {
        var errmess = 'Still loading blocktree. '
        err += errmess
        blocktree.on('initialized', (e) => {
          errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
          gInit(resolve)
        })
      } else gInit(resolve)

    }),
    new Promise((resolve, reject) => {
      if (typeof myKey === 'undefined') {
        var errmess = 'Still generating keys. '
        err += errmess
        wrapper.addEventListener('mykey-ready', function (e) {
          errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
          resolve()
        }, false)
      }
    
    }),
    new Promise((resolve, reject) => {
      if (typeof ghcreds === 'undefined') {
        var errmess = 'Git host authentication is required. '
        err += errmess
        ghOAUTH()
        wrapper.addEventListener('oauth-ready', function (e) {
          errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
          return ghInit(resolve)
        }, false)
      } else return ghInit(resolve)
  
    })
  ]).then(() => {
    presubmit()
    checkGName()
  })

  load(err)
  // Hidding menu if settings are not saved
  chrome.storage.local.get('gh', function (data) {
    if (typeof data.gh === 'undefined') {
      document.getElementById('footer_menu').innerHTML = ''
    }
  })
  
  function submitGithub (e) {
    e.preventDefault()
    checkGName().then(avail => {
      if (avail === false) return
      var ghname = document.getElementById('gh-username').value
      var gname = document.getElementById('guld-name').value
      var options = {
        data: JSON.stringify({
          oauth: OAUTH_TOKEN,
          username: USER
        }),
        publicKeys: keyring.publicKeys.getForId(myKey.key.primaryKey.fingerprint),
        privateKeys: [myKey.key]
      }

      routes('dash', function (next) {
        openpgp.encrypt(options).then(function (ciphertext) {
          var encrypted = ciphertext.data
          chrome.storage.local.set({
            gh: encrypted
          }, function () {
            next('')
          })
        })
      })
    })
  }
}

