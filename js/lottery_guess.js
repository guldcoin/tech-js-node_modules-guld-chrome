'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false BACK_TEMPLATE:false load:false routes:false */

function lotteryGuessTemplate () { // eslint-disable-line no-unused-vars
  return `${topMenuTemplate()}
    <div class="black_bg">
      <h1 class="text-center">Lottery</h1>

      <div class="row">
        <div id="room_name">Room name</div>
      </div>

      <div id="room_info">
        <div id="bet_amount_info">
          <div class="name">Bet Amount</div>
          <div class="value">350</div>
        </div>
        <div id="max_info">
          <div class="name">Max</div>
          <div class="value">645</div>
        </div>
        <div id="win_chance_info">
          <div class="name">Win Chance</div>
          <div class="value">25%</div>
        </div>
      </div>

      <div class="row">
        <input id="guess_amount" type="text"></input>
      </div>
      
      <div class="row">
        <button>Guess</button>
      </div>

      ${ERR_TEMPLATE}
      ${BACK_TEMPLATE}
    </div>`
}

function loadLotteryGuessRoom (err) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = lotteryGuessTemplate()
  load(err)
  document.getElementById('back-div').addEventListener('click', function () {
    routes('lottery_pick_room', function (next) {
      next('')
    })
  })
}
