'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false GitHub:true */

const GH_TEMPLATE =
    `${LOGO_TEMPLATE}

<form id="github-credentials-form">

  <div class="row">
    <input type="text" id="key-gh-username" placeholder="Github username"></input><br>
  </div>

  <div class="row">
    <input type="password" id="key-gh-password" placeholder="Github password"></input><br>
  </div>

  <div class="row">
    <button type="submit" value="store">Secure and store</button>
  </div>

  ${ERR_TEMPLATE}

</form>`

function loadGithub (err, key, passphrase) { // eslint-disable-line no-unused-vars
  // Load view
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = GH_TEMPLATE
  document.getElementById('github-credentials-form').addEventListener(
    'submit',
    function (e) {
      submitGithub(e, key, passphrase)
    })
  load(err)
}

function submitGithub (e, key, passphrase) {
  e.preventDefault()
  var uname = document.getElementById('key-gh-username').value
  var password = document.getElementById('key-gh-password').value
  var options = {
    data: JSON.stringify({
      username: uname,
      password: password
    }),
    publicKeys: keyring.publicKeys.getForId(key.primaryKey.fingerprint),
    privateKeys: [key]
  }

  var gh = new GitHub({
    username: uname,
    password: password
    /* also acceptable:
           token: 'MY_OAUTH_TOKEN'
         */
  })

  routes('gamelist', function (next) {
    gh.getRateLimit().getRateLimit()
      .then(function (resp) {
        if (resp.data.rate.remaining) {
          openpgp.encrypt(options).then(function (
            ciphertext) {
            var encrypted = ciphertext.data
            chrome.storage.local.set({
              gh: encrypted
            }, function () {
              next('')
            })
          })
        } else {
          routes('github', function (back) {
            back('API Limit reached', key,
              passphrase)
          })
        }
      }).catch(function () {
        routes('github', function (back) {
          back('Invalid credentials', key,
            passphrase)
        })
      })
  })
}
