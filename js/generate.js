'use strict';

const gen_template = `<form id="generate-key-form">
  
  <div class="row">
    <input type="text" id="key-name" placeholder="Name"></input><br>
  </div>

  <div class="row">
    <input type="text" id="key-email" placeholder="Email"></input><br>
  </div>

  <div class="row">
    <input type="password" id="key-passphrase" placeholder="PGP Key Passphrase"></input><br>
  </div>

  ` + err_template + `  

  <span class="warning">WARNING: Name and email will be public!</span><br>

  <div class="row">
    <button id="generate" type="submit" value="Generate">Generate</button>
  </div>

  <div id="skip-gen-div" class="row"> 
  </div>  
</form>`;

function loadGenerate(err) {
    var wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = gen_template;
    if (keyring.privateKeys.keys.length > 0) {
        document.getElementById("skip-gen-div").innerHTML = `<button id="skip-gen" class="text-button" value="Skip">Skip</button>`;
        document.getElementById("skip-gen").addEventListener("click", loadLogin);
    }
    document.getElementById("generate-key-form").addEventListener("submit", submitGenerate);
    load(err);
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
}