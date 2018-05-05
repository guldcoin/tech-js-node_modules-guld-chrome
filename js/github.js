'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false GitHub:false FOOTER_TEMPLATE:false b:false gh:true GG_CACHE:true wrapper:false myKey:true ghOAUTH:true */

function ghTemplate () {
  return `${topMenuTemplate()}
  <form id="name-selection-form">

  <div class="row">
    <input type="text" id="gh-username" placeholder="github username" value="${GG_CACHE['ghuser']}"></input><br>
  </div>

  <div class="row">
    <input type="text" id="guld-name" placeholder="guld username" value="${GG_CACHE['user']}"></input><br>
  </div>
  ${ERR_TEMPLATE}

  <div class="row">
    <button type="submit" value="store">Save</button>
  </div>
</form>  
${FOOTER_TEMPLATE}`
}

function initGitHub () {
  gh = new GitHub({token: GG_CACHE['oauth']})
  var guser = gh.getUser()
  if (GG_CACHE.hasOwnProperty('ghuser') && GG_CACHE['ghuser'].length > 0) return Promise.resolve(GG_CACHE['ghuser'])
  return guser.getProfile().then(profile => {
    GG_CACHE['ghuser'] = profile.data.login
    GG_CACHE['gh_avatar_url'] = profile.data.avatar_url
    return GG_CACHE['ghuser']
  })
}

function loadGithub (err) { // eslint-disable-line no-unused-vars
  // Load view
  wrapper.innerHTML = ghTemplate()
  var guldn = document.getElementById('guld-name')
  var errdiv = document.getElementById('err-div')
  var nsf = document.getElementById('name-selection-form')
  const NAMEWARN = 'Guld name is not available or valid, choose another.'
  nsf.addEventListener('submit', submitGithub)

  var presubmit = () => {
    if (errdiv.innerHTML.indexOf(NAMEWARN) > -1) {
      errdiv.innerHTML = errdiv.innerHTML.replace(/Guld name is not available or valid, choose another\./g, '')
    }
  }

  var ghInit = () => {
    return initGitHub().then(() => {
      var ghn = document.getElementById('gh-username')
      ghn.value = GG_CACHE['ghuser']
      ghn.disabled = true
      if (!guldn.value || guldn.value.length === 0) {
        guldn.value = ghn.value
        return checkGName()
      } else return
    })
  }

  var checkGName = () => {
    if (!b.blocktree || !b.blocktree.initialized || guldn.value.length == 0) return Promise.resolve(false)
    return b.blocktree.isNameAvail(guldn.value).then(avail => {
      if (avail) {
        presubmit()
      } else {
        if (errdiv.innerHTML.indexOf(NAMEWARN) == -1) {
          errdiv.innerHTML = `${errdiv.innerHTML} ${NAMEWARN}`
        }
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

  function submitGithub (e) {
    checkGName().then(avail => {
      if (avail === false) {
        return
      }
      e.preventDefault()
      GG_CACHE['user'] = guldn.value
      nsf.disabled = true
      storeCache().then(() => {
        routes('dash', '')
      })
    })
  }

  load(err)

//  checkGName()
}
