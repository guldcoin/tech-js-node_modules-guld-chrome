'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false FOOTER_TEMPLATE:false load:false routes:false */

function dashTemplate() {
  return `${topMenuTemplate()}

  <div id="profile">
      <div id="username" class="text-center">${GG_CACHE['user']}</div>
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
}

function loadDash (err) { // eslint-disable-line no-unused-vars
  wrapper.innerHTML = dashTemplate()
  load(err)
  document.getElementById('playgame').addEventListener('click', function () {
    routes('lottery_pick_room', '')
  })
}
