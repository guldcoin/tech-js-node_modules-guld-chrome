'use strict';

function loadLogin() {
  var wrapper = document.getElementById("wrapper");
  var keymap = keyring.privateKeys.keys.map(function(key) {
    var fpr = key.primaryKey.fingerprint
    return `<option value="${fpr}">${fpr}</option>`
  });
  var keyopts = keymap.join("\n");
  wrapper.innerHTML = `
  <form id="key-login-form">
  <div class="row text-right">
    <select id="key-fpr">${keyopts}</select>
    <button id="goto-generate-button" class="text-button" value="Generate">Manage keys</button><br>
  </div>

  <div class="row">
    <input id="login-passphrase" type="password" placeholder="PGP Key Passphrase"></input><br>
  </div>

  <div class="row">
    <button id="login-submit" type="submit" value="Login">Login</button>
  </div>

  </form>`
  document.getElementById("key-login-form").addEventListener("submit", submitLogin);
  document.getElementById("goto-generate-button").addEventListener("click", loadGenerate);
}

function submitLogin() {
  var fprlist = document.getElementById("key-fpr");
  var fpr = fprlist.options[fprlist.selectedIndex].value
  var passphrase = document.getElementById("login-passphrase").value;
  var key = keyring.privateKeys.getForId(fpr)
  decryptKeyThenGithub(key, passphrase)
}

document.addEventListener('DOMContentLoaded', function() {
  if (keyring.privateKeys.keys.length > 0) {
    loadLogin()
  } else {
    loadGenerate()
  }
});
