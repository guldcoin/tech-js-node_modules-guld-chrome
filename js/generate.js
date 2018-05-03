'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false FOOTER_TEMPLATE:false */

const GEN_TEMPLATE =
    `${LOGO_TEMPLATE}
<form id="generate-key-form">

  <div class="row">
    <input type="text" id="key-name" placeholder="Name" autocomplete="username" value="pokerface"></input><br>
  </div>

  <div class="row">
    <input type="text" id="key-email" placeholder="Email" autocomplete="email" value="guld-games-poker-face@gmail.com"></input><br>
  </div>

  <div class="row">
    <input type="password" id="key-passphrase" placeholder="PGP Key Passphrase" autocomplete="new-password" value="tUg5iiwZfso2m3BwRdT9"></input><br>
  </div>

  ${ERR_TEMPLATE}

  <span id="err-warn" class="warning">WARNING: Name and email will be public!</span><br>

  <div class="row">
    <button id="generate" type="submit" value="Generate">Generate</button>
  </div>
</form>

  ${FOOTER_TEMPLATE}`

function loadGenerate (err) { // eslint-disable-line no-unused-vars
  wrapper.innerHTML = GEN_TEMPLATE
  if (keyring.privateKeys.keys.length > 0) {
    document.getElementById('skip-gen-div').innerHTML =
            `<button id="skip-gen" class="text-button" value="Skip">Skip</button>`
    document.getElementById('skip-gen').addEventListener('click', loadLogin)
  }

  document.getElementById('generate-key-form').addEventListener('submit',
    submitGenerate)

  //  document.getElementById('key-name').addEventListener('focusout', validateKeyName)

  load(err)
}

function submitGenerate (e) {
  e.preventDefault()
  var uname = document.getElementById('key-name').value
  var email = document.getElementById('key-email').value
  var passphrase = document.getElementById('key-passphrase').value
  var options = {
    numBits: 4096,
    userIds: [{
      name: uname,
      email: email
    }],
    passphrase: passphrase
  }
  routes('github', function (next) {
    openpgp.generateKey(options).then(function (key) {
      keyring.publicKeys.importKey(key.publicKeyArmored)
      keyring.privateKeys.importKey(key.privateKeyArmored)
      keyring.store()
      key.key.decrypt(passphrase).then(() => {
        myKey = key
        wrapper.dispatchEvent(new Event('mykey-ready'))
      })
    })
    next('')
  })
}

// function validateKeyName (event) {
//  if (!isNameAvail) {

//  }
// }
