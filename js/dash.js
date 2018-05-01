'use strict'

/* global ERR_TEMPLATE:false FOOTER_TEMPLATE:false load:false */

const DASH_TEMPLATE = // eslint-disable-line no-unused-vars
    `<nav>
        <img id="logo_dash" src="images/logo2.svg">
        <div id="balance">
            <div class="balances"><span class="gg text-right">2.5147</span><span class="usd text-right">176.029</span></div>
            <div class="assets"><span class="gg text-left">GG</span><span class="usd text-left">USD</span></div>
        </div>
    </nav>

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
}
