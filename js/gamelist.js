'use strict';

const game_list_template = `game list found <3`;

function loadGameList(err) {
    var wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = game_list_template;
    load(err);
}