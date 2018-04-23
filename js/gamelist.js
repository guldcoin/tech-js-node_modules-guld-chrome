'use strict';

const game_list_template = `game list found <3`;

function decryptKeyThenGameList(key, passphrase) {
  if (key.hasOwnProperty('key')) key = key.key
  key.decrypt(passphrase).then(function(result) {
    loadGameList();
  }, function(err) {
    alert(err)
  })
}

function loadGameList() {
  var wrapper = document.getElementById("wrapper");
  wrapper.innerHTML = game_list_template;
}
