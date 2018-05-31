const GitHub = require('github-api')

async function loadGithubVals () {
  await this.observer.hosts.github.initGitHub()
  document.getElementById('gh-login-div').style.display = 'none'
  document.getElementById('ghavatar-div').style.display = 'block'
  document.getElementById('ghavatar').src = this.observer.hosts.github.avatar
  if (this.observer.hosts.github.mail && this.observer.hosts.github.mail.length > 0 &&
      (!guldmailDiv.value ||
       guldmailDiv.value.length === 0)) {
    guldmailDiv.value = this.observer.hosts.github.mail
  }
  if (this.observer.hosts.github.name && this.observer.hosts.github.name.length > 0 && (!guldnameDiv.value || guldnameDiv.value.length === 0)) {
    guldnameDiv.value = this.observer.hosts.github.name
    return this.observer.checkGName()
  } else return true
}

async function loadGithub () {
  if (!(this.observer.hosts.github.auth) ||
    !(this.observer.hosts.github.auth.password) ||
    this.observer.hosts.github.auth.password.length === 0
  ) {
    var errmess = 'Git host authentication is required. '
    this.observer.setError(errmess)
    var token = await this.observer.hosts.github.ghOAUTH()
    this.observer.unsetError(errmess)
    return this.observer.hosts.github.loadGithubVals()
  } else return this.observer.hosts.github.loadGithubVals()
}

async function get () { // eslint-disable-line no-unused-vars
  return this.observer.db.getMany(['ghname', 'ghmail', 'ghkeyid', 'ghavatar', 'ghoauth']).then(vals => {
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

async function set () { // eslint-disable-line no-unused-vars
  if (ghoauth.length > 0) {
    return simpleEncrypt(self.ghoauth).then(enc => {
      return this.observer.db.setMany({
        ghname: self.ghname,
        ghmail: self.ghmail,
        ghkeyid: self.ghkeyid,
        ghavatar: self.ghavatar,
        ghoauth: enc
      })
    })
  } else {
    return this.observer.db.setMany({
      ghname: self.ghname,
      ghmail: self.ghmail,
      ghkeyid: self.ghkeyid,
      ghavatar: self.ghavatar,
      ghoauth: ''
    })
  }
}

// Github helpers

async function initGitHub () { // eslint-disable-line no-unused-vars
  self.gh = new GitHub({token: this.observer.hosts.github.auth.password})
  if (self.ghname && self.ghname.length > 0) return Promise.resolve()
  var guser = gh.getUser()
  return guser.getProfile().then(profile => {
    this.observer.hosts.github.name = profile.data.login
    this.observer.hosts.github.avatar = profile.data.avatar_url
    this.observer.hosts.github.mail = profile.data.email
    return this.observer.hosts.github.getGHKeys()
  })
}

async function getGHKeys () {
  var keys = JSON.parse(await this.observer.curl(`https://api.github.com/users/${this.observer.hosts.github.name}/gpg_keys`))
  if (keys.length !== 0) {
    this.observer.hosts.github.keyid = keys[0].key_id
    if (keys[0].emails.length !== 0) {
      this.observer.hosts.github.mail = keys[0].emails[0].email
    }
  }
}

async function setupGHKey () { // eslint-disable-line no-unused-vars
  if (!self.ghkeyid || self.ghkeyid.length === 0) {
    return self.observer.curl(`https://api.github.com/user/gpg_keys`,
      {
        'method': 'POST',
        'body': JSON.stringify({'armored_public_key': self.keyring.publicKeys.getForId(self.guldfpr).armor()})
      }
    ).then(getGHKeys)
  } else return getGHKeys()
}

async function getTokenForCode (code) {
  this.observer.hosts.github.auth.password = await this.observer.curl(`https://guld.gg/api/OAUTH_TOKEN?code=${code}`)
  // XXX move this event to new emitter?
  this.observer.emit('oauth-ready')
  return this.observer.hosts.github.auth.password
}

async function ghOAUTH () { // eslint-disable-line no-unused-vars
  var reulr = chrome.identity.getRedirectURL('provider_cb')
  var scope = encodeURIComponent(this.observer.manifest.oauth2.scopes.join(' '))
  var options = {
    'interactive': true,
    'url': `https://github.com/login/oauth/authorize?client_id=${this.observer.manifest.oauth2.client_id}&redirect_uri=${encodeURIComponent(reulr)}&scope=${scope}`
  }
  var self = this
  return new Promise((resolve, reject) => {
    function handler (rurl) {
      if (rurl) {
        var code = rurl.split('=')[1]
        self.observer.hosts.github.getTokenForCode(code).then(resolve)
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

async function createPR (org, repo) {
  return this.observer.hosts.github.client.getRepo(org, repo).createPullRequest({
    title: 'guld app created tx PR',
    head: `${self.guldname}:master`,
    base: 'master'
  })
}

async function forkGuld () { // eslint-disable-line no-unused-vars
  return Promise.all([
    this.observer.hosts.github.client.getRepo('guldcoin', 'ledger-guld').fork().catch(e => {}),
    this.observer.hosts.github.client.getRepo('guldcoin', 'keys-pgp').fork().catch(e => {}),
    this.observer.hosts.github.client.getRepo('tigoctm', 'token-prices').fork().catch(e => {}),
    this.observer.hosts.github.client.getRepo('guld-games', 'ledger-gg').fork().catch(e => {})
  ])
}

module.exports = {
  loadGithubVals: loadGithubVals,
  loadGithub: loadGithub,
  initGitHub: initGitHub,
  getGHKeys: getGHKeys,
  setupGHKey: setupGHKey,
  getTokenForCode: getTokenForCode,
  createPR: createPR,
  forkGuld: forkGuld,
  ghOAUTH: ghOAUTH,
  get: get,
  set: set
}

