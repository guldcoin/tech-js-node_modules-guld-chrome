'use strict';

const gh_template = `<form id="github-credentials-form">

  <div class="row">
    <input type="text" id="key-gh-username" placeholder="Github username"></input><br>
  </div>

  <div class="row">
    <input type="password" id="key-gh-password" placeholder="Github password"></input><br>
  </div>

  <div class="row">
    <button type="submit" value="store">Secure and store</button>
  </div>

  <div id="github-feedback-div" class="row"> 
  </div>

</form>`;

function decryptKeyThenGithub(key, passphrase) {
    if (key.hasOwnProperty('key')) key = key.key
    key.decrypt(passphrase).then(function (result) {
        // Load view
        var wrapper = document.getElementById("wrapper");
        wrapper.innerHTML = gh_template;
        document.getElementById("github-credentials-form").addEventListener("submit", function (e) {
            submitGithub(e, key, passphrase)
        });
    }, function (err) {
        alert(err)
    })
}

function submitGithub(e, key, passphrase) {
    e.preventDefault();
    var uname = document.getElementById("key-gh-username").value;
    var password = document.getElementById("key-gh-password").value;
    var options = {
        data: JSON.stringify({
            username: uname,
            password: password
        }),
        publicKeys: keyring.publicKeys.getForId(key.primaryKey.fingerprint),
        privateKeys: [key]
    };

    curl("https://api.github.com", {
        method: "GET",
        headers: {
            Authorization: "Basic " + btoa(unescape(encodeURIComponent( uname + ":" + password )))
        }
    }, function(success){
        openpgp.encrypt(options).then(function (ciphertext) {
            var encrypted = ciphertext.data;
            chrome.storage.local.set({
                gh: encrypted
            }, function () {
                routes("gamelist", function (next) {
                    next();
                });
            });
        });    
    }, function(error){
        document.getElementById("github-feedback-div").innerHTML = `<p class="error">Invalid credentials</p>`;        
    });
}