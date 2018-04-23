'use strict';

const game_list_template = `game list found <3`;

function decryptKeyThenGameList(key, passphrase) {
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
