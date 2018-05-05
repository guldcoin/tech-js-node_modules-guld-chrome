'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false openpgp:false FOOTER_TEMPLATE:false wrapper:false myKey:true loadLogin:false Event:false */

function genTemplate() {
  return `${LOGO_TEMPLATE}
<form id="generate-key-form">

<div class="row">
  <input type="text" id="key-name" placeholder="Name" autocomplete="username" value="${GG_CACHE['user']}"></input><br>
</div>

<div class="row">
  <input type="text" id="key-email" placeholder="Email" autocomplete="email" value="${GG_CACHE['email']}"></input><br>
</div>

<div class="row">
  <input type="password" id="key-passphrase" placeholder="PGP Key Passphrase" autocomplete="new-password" value=""></input><br>
</div>

${ERR_TEMPLATE}

<span id="err-warn" class="warning">WARNING: Name and email will be public!</span><br>

<div class="row">
  <button id="generate" type="submit" value="Generate">Generate</button>
</div>
</form>

${FOOTER_TEMPLATE}`
}

function loadGenerate (err) { // eslint-disable-line no-unused-vars
  wrapper.innerHTML = genTemplate()

  document.getElementById('generate-key-form').addEventListener('submit',
    submitGenerate)
  load(err)
}

function submitGenerate (e) {
  e.preventDefault()
  GG_CACHE['key-name'] = document.getElementById('key-name').value
  GG_CACHE['email'] = document.getElementById('key-email').value
  var pass = document.getElementById('key-passphrase').value
  var options = {
    numBits: 4096,
    userIds: [{
      name: GG_CACHE['key-name'],
      email: GG_CACHE['email']
    }],
    passphrase: pass
  }
  routes('github', '')
  openpgp.generateKey(options).then(function (key) {
    keyring.publicKeys.importKey(key.publicKeyArmored)
    keyring.privateKeys.importKey(key.privateKeyArmored)
    GG_CACHE['fpr'] = key.key.primaryKey.fingerprint
    keyring.store()
    key.key.decrypt(pass).then(() => {
      myKey = key.key
      wrapper.dispatchEvent(new Event('mykey-ready'))
    })
  })
}

// function validateKeyName (event) {
//  if (!isNameAvail) {

//  }
// }
