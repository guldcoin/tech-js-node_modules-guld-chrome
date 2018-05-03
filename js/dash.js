'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false FOOTER_TEMPLATE:false load:false routes:false */

const DASH_TEMPLATE = // eslint-disable-line no-unused-vars
  `${TOP_MENU_TEMPLATE}

    <div id="profile">
        <div id="name" class="text-center">Daniel Castellanos</div>
        <div id="username" class="text-center">srcreativo</div>
    </div>

    <div id="game_pick" class="row">
        <img id="lottery_pick" class="pick active" src="images/lottery.svg">
        <div class="description text-center">Lottery</div>
    </div>

    ${ERR_TEMPLATE}  

    <div class="row">
        <button id="playgame" type="submit" value="Play">Play Game</button>
    </div>

  ${FOOTER_TEMPLATE}`

function loadDash (err, key, passphrase) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = DASH_TEMPLATE
  load(err, key, passphrase)

  document.getElementById('playgame').addEventListener('click', function () {
    routes('lottery_pick_room', function (next) {
      next('', key, passphrase)
    })
  })
}
