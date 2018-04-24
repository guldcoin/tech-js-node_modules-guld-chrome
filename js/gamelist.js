'use strict';

const game_list_template = `game list found <3`;

function loadGameList() {
    var wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = game_list_template;
}