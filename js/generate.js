'use strict';

const gen_template = `<form id="generate-key-form">
  <input type="text" id="key-name" placeholder="Name"></input><br>

  <input type="text" id="key-email" placeholder="Email"></input><br>
  
  <input type="password" id="key-passphrase" placeholder="PGP Key Passphrase"></input><br>

  <span class="warning">WARNING: Name and email will be public!</span><br>
  
  <button id="generate" type="submit" value="Generate">Generate</button>
</form>`;

function loadGenerate() {
  var wrapper = document.getElementById("wrapper");
  wrapper.innerHTML = gen_template;
  document.getElementById("generate-key-form").addEventListener("submit", submitGenerate);
}

function submitGenerate(e) {
  e.preventDefault();
  var uname = document.getElementById("key-name").value;
  var email = document.getElementById("key-email").value;
  var passphrase = document.getElementById("key-passphrase").value;
  var options = {
    numBits: 4096,
    userIds: [{ name: uname, email: email }],
    passphrase: passphrase
  };
  openpgp.generateKey(options).then(function(key) {
    var privkey = key.privateKeyArmored;
    var pubkey = key.publicKeyArmored;
    keyring.publicKeys.importKey(pubkey);
    keyring.privateKeys.importKey(privkey);
    keyring.store();
    decryptKeyThenGameList(key, passphrase);
  });
}
