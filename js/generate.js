'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false FOOTER_TEMPLATE:false wrapper:false myKey:true loadLogin:false Event:false */

function genTemplate() {
  return `${LOGO_TEMPLATE}
<form id="generate-key-form">

<div class="row">
  <input type="text" id="key-name" placeholder="Name" autocomplete="username" value="${USER}"></input><br>
</div>

<div class="row">
  <input type="text" id="key-email" placeholder="Email" autocomplete="email" value="${EMAIL}"></input><br>
</div>

<div class="row">
  <input type="password" id="key-passphrase" placeholder="PGP Key Passphrase" autocomplete="new-password" value="${PASSWORD}"></input><br>
</div>

${ERR_TEMPLATE}

<span id="err-warn" class="warning">WARNING: Name and email will be public!</span><br>

<div class="row">
  <button id="generate" type="submit" value="Generate">Generate</button>
</div>
<div class="row">
  <div id="skip-gen-div"></div>
</div>
</form>

${FOOTER_TEMPLATE}`
}

function loadGenerate (err) { // eslint-disable-line no-unused-vars
  wrapper.innerHTML = genTemplate()
  if (keyring.privateKeys.keys.length > 0) {
    document.getElementById('skip-gen-div').innerHTML =
            `<button id="skip-gen" class="text-button" value="Skip">Skip</button>`
    document.getElementById('skip-gen').addEventListener('click', loadLogin)
  }

  document.getElementById('generate-key-form').addEventListener('submit',
    submitGenerate)
  // if debugging, auto-submit
  if (PASSWORD && PASSWORD.length > 0) submitGenerate(new Event('submit'))
  load(err)
}

function submitGenerate (e) {
  e.preventDefault()
  USER = document.getElementById('key-name').value
  EMAIL = document.getElementById('key-email').value
  PASSWORD = document.getElementById('key-passphrase').value
  var options = {
    numBits: 4096,
    userIds: [{
      name: USER,
      email: EMAIL
    }],
    passphrase: PASSWORD
  }
  routes('github', '')
  openpgp.generateKey(options).then(function (key) {
    keyring.publicKeys.importKey(key.publicKeyArmored)
    keyring.privateKeys.importKey(key.privateKeyArmored)
    keyring.store()
    key.key.decrypt(PASSWORD).then(() => {
      myKey = key.key
      wrapper.dispatchEvent(new Event('mykey-ready'))
    })
  })
}

// function validateKeyName (event) {
//  if (!isNameAvail) {

//  }
// }
