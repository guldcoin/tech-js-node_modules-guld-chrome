'use strict';

function loadLogin() {
  var wrapper = document.getElementById("wrapper");
  var keymap = keyring.privateKeys.keys.map(function(key) {
    var fpr = key.primaryKey.fingerprint
    return `<option value="${fpr}">${fpr}</option>`
  });
  var keyopts = keymap.join("\n");
  wrapper.innerHTML = `<button id="goto-generate-button" value="Generate">Generate</button><br>
  <form id="key-login-form">
  <select id="key-fpr">${keyopts}</select>
  <input id="login-passphrase" type="password"></input>
  <input id="login-submit" type="submit" value="Login"></input>
  </form>`
  document.getElementById("key-login-form").addEventListener("submit", submitLogin);
  document.getElementById("goto-generate-button").addEventListener("click", loadGenerate);
}

function submitLogin() {
  var fprlist = document.getElementById("key-fpr");
  var fpr = fprlist.options[fprlist.selectedIndex].value
  var passphrase = document.getElementById("login-passphrase").value;
  var key = keyring.privateKeys.getForId(fpr)
  decryptKeyThenGameList(key, passphrase)
}

document.addEventListener('DOMContentLoaded', function() {
  if (keyring.privateKeys.keys.length > 0) {
    loadLogin()
  } else {
    loadGenerate()
  }
});
