'use strict'

/* global load:false */

const GAME_LIST_TEMPLATE = `game list found <3`

function loadGameList (err) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = GAME_LIST_TEMPLATE
  load(err)
}
