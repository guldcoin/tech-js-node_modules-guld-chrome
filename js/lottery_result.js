'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false BACK_TEMPLATE:false load:false routes:false */

const LOTTERY_RESULT_WIN_ROOM_TEMPLATE = // eslint-disable-line no-unused-vars
    `${TOP_MENU_TEMPLATE}
    <div  id="lottery_result" class="black_bg">
      <div id="result_head" class="row">
        <img src="images/winner.svg">
      </div>

      <div class="row">
        <input id="guess_amount" type="text" value="415" disabled></input>
      </div>
      
      <div id="result_indicator" class="row">
        <button class="go" disabled>You Win</button>
      </div>

      <div id="guess_result_amount" class="row">
        <img src="images/chip.svg"> <span>+250</span>
      </div>

      ${ERR_TEMPLATE}
      ${BACK_TEMPLATE}
    </div>`

const LOTTERY_RESULT_LOSE_ROOM_TEMPLATE = // eslint-disable-line no-unused-vars
    `${TOP_MENU_TEMPLATE}
    <div  id="lottery_result" class="black_bg">
      <div id="result_head" class="row">
        <img src="images/loser.svg">
      </div>

      <div class="row">
        <input id="guess_amount" type="text" value="415" disabled></input>
      </div>
      
      <div id="result_indicator" class="row">
        <button disabled>You Lose</button>
      </div>

      <div id="guess_result_amount" class="row">
        <img src="images/chip.svg"> <span>-250</span>
      </div>

      ${ERR_TEMPLATE}
      ${BACK_TEMPLATE}
    </div>`

function loadLotteryResultRoom (err, key, passphrase) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = LOTTERY_RESULT_LOSE_ROOM_TEMPLATE
  load(err)
  document.getElementById('back-div').addEventListener('click', function () {
    routes('lottery_pick_room', function (next) {
      next('', key, passphrase)
    })
  })
}
