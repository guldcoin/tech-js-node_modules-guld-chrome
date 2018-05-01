'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false loadLogin:false load:false routes:false openpgp:false */

const GEN_TEMPLATE =
    `${LOGO_TEMPLATE}
<form id="generate-key-form">

  <div class="row">
    <input type="text" id="key-name" placeholder="Name"></input><br>
  </div>

  <div class="row">
    <input type="text" id="key-email" placeholder="Email"></input><br>
  </div>

  <div class="row">
    <input type="password" id="key-passphrase" placeholder="PGP Key Passphrase"></input><br>
  </div>

  ${ERR_TEMPLATE}

  <span class="warning">WARNING: Name and email will be public!</span><br>

  <div class="row">
    <button id="generate" type="submit" value="Generate">Generate</button>
  </div>
</form>

  ${FOOTER_TEMPLATE}`;    

function loadGenerate(err, key, passphrase) {
    var wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = gen_template;
    document.getElementById("generate-key-form").addEventListener("submit", submitGenerate);
    load(err, key, passphrase);
}

function submitGenerate(e) {
    e.preventDefault();
    var uname = document.getElementById("key-name").value;
    var email = document.getElementById("key-email").value;
    var passphrase = document.getElementById("key-passphrase").value;
    var options = {
        numBits: 4096,
        userIds: [{
            name: uname,
            email: email
        }],
        passphrase: passphrase
    };
    if ((uname.length) && (email.length) && (passphrase.length)) {
        routes("decrypt", function (next) {
            openpgp.generateKey(options).then(function (key) {
                var privkey = key.privateKeyArmored;
                var pubkey = key.publicKeyArmored;
                keyring.publicKeys.importKey(pubkey);
                keyring.privateKeys.importKey(privkey);
                keyring.store();
                next("", key, passphrase);
            });
        });
    } else {
        load("Please provide a user, email and passphrase");
    }
}