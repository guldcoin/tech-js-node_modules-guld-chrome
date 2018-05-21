const GitHub = require('github-api')

module.exports.loadGithubVals = async () => {
  await b.initGitHub()
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
}

module.exports.loadGithub = async () => {
  if (b.ghoauth.length === 0) {
    var errmess = 'Git host authentication is required. '
    setError(errmess)
    var token = await b.ghOAUTH()
    unsetError(errmess)
    return loadGithubVals()
  } else return loadGithubVals()
}

module.exports.get = () => { // eslint-disable-line no-unused-vars
  return getLocal(['ghname', 'ghmail', 'ghkeyid', 'ghavatar', 'ghoauth']).then(vals => {
    self.ghname = vals.ghname
    self.ghmail = vals.ghmail
    self.ghkeyid = vals.ghkeyid
    self.ghavatar = vals.ghavatar
    if (self.guldfpr && vals.ghoauth.length > 0) {
      return simpleDecrypt(vals.ghoauth).then(token => {
        self.ghoauth = token
        return {
          ghname: self.ghname,
          ghmail: self.ghmail,
          ghkeyid: self.ghkeyid,
          ghavatar: self.ghavatar,
          ghoauth: self.ghoauth
        }
      })
    } else {
      return {
        ghname: self.ghname,
        ghmail: self.ghmail,
        ghkeyid: self.ghkeyid,
        ghavatar: self.ghavatar,
        ghoauth: self.ghoauth
      }
    }
  })
}

module.exports.set = () => { // eslint-disable-line no-unused-vars
  if (ghoauth.length > 0) {
    return simpleEncrypt(self.ghoauth).then(enc => {
      return setLocal({
        ghname: self.ghname,
        ghmail: self.ghmail,
        ghkeyid: self.ghkeyid,
        ghavatar: self.ghavatar,
        ghoauth: enc
      })
    })
  } else {
    return setLocal({
      ghname: self.ghname,
      ghmail: self.ghmail,
      ghkeyid: self.ghkeyid,
      ghavatar: self.ghavatar,
      ghoauth: ''
    })
  }
}

// Github helpers

window.initGitHub = () => { // eslint-disable-line no-unused-vars
  self.gh = new GitHub({token: ghoauth})
  if (self.ghname && self.ghname.length > 0) return Promise.resolve()
  var guser = gh.getUser()
  return guser.getProfile().then(profile => {
    self.ghname = profile.data.login
    self.ghavatar = profile.data.avatar_url
    self.ghmail = profile.data.email
    return getGHKeys()
  })
}

function getGHKeys () {
  return self.curl(`https://api.github.com/users/${self.ghname}/gpg_keys`)
    .then(keys => {
      keys = JSON.parse(keys)
      if (keys.length !== 0) {
        self.ghkeyid = keys[0].key_id
        if (keys[0].emails.length !== 0) {
          self.ghmail = keys[0].emails[0].email
        }
      }
    })
}

window.setupGHKey = () => { // eslint-disable-line no-unused-vars
  if (!self.ghkeyid || self.ghkeyid.length === 0) {
    return self.curl(`https://api.github.com/user/gpg_keys`,
      {
        'method': 'POST',
        'body': JSON.stringify({'armored_public_key': self.keyring.publicKeys.getForId(self.guldfpr).armor()})
      }
    ).then(getGHKeys)
  } else return getGHKeys()
}

function getTokenForCode (code) {
  return self.curl(`https://guld.gg/api/OAUTH_TOKEN?code=${code}`,
    {}).then(token => {
    self.ghoauth = token
    self.ghcreds = git.utils.oauth2('github', token)
    // TODO move at least this event to new emitter
    blocktree.emit('oauth-ready')
    return token
  })
}

window.ghOAUTH = () => { // eslint-disable-line no-unused-vars
  var reulr = chrome.identity.getRedirectURL('provider_cb')
  var scope = encodeURIComponent(manifest.oauth2.scopes.join(' '))
  var options = {
    'interactive': true,
    'url': `https://github.com/login/oauth/authorize?client_id=${manifest.oauth2.client_id}&redirect_uri=${encodeURIComponent(reulr)}&scope=${scope}`
  }
  return new Promise((resolve, reject) => {
    function handler (rurl) {
      if (rurl) {
        var code = rurl.split('=')[1]
        getTokenForCode(code).then(resolve)
      } else {
        reject(chrome.runtime.lastError)
      }
    }
    try {
      chrome.identity.launchWebAuthFlow(options, handler)
    } catch (er) {
      reject(er)
    }
  })
}

function createPR (org, repo) {
  return self.gh.getRepo(org, repo).createPullRequest({
    title: 'guld app created tx PR',
    head: `${self.guldname}:master`,
    base: 'master'
  })
}

window.forkGuld = () => { // eslint-disable-line no-unused-vars
  return Promise.all([
    self.gh.getRepo('guldcoin', 'ledger-guld').fork().catch(e => {}),
    self.gh.getRepo('guldcoin', 'keys-pgp').fork().catch(e => {}),
    self.gh.getRepo('tigoctm', 'token-prices').fork().catch(e => {}),
    self.gh.getRepo('guld-games', 'ledger-gg').fork().catch(e => {})
  ])
}

