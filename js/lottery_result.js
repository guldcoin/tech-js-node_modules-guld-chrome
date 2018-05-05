'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false BACK_TEMPLATE:false load:false routes:false */

var WINNER_IMG = // eslint-disable-line no-unused-vars
  'images/winner.svg'

var LOSER_IMG = // eslint-disable-line no-unused-vars
  'images/loser.svg'

function lotteryResultTemplate () { // eslint-disable-line no-unused-vars
  return `${topMenuTemplate()}
    <div  id="lottery_result" class="black_bg">
      <div id="result_head" class="row">
        <img id="result_head_img" src="images/expectation.svg">
      </div>

      <div class="row">
        <div id="guess_amount" class="odometer">165535</div>
      </div>
      
      <div id="result_info">
      </div>

      ${ERR_TEMPLATE}
      ${BACK_TEMPLATE}
    </div>`
}

function lotteryInfoWinTemplate () { // eslint-disable-line no-unused-vars
  return `
    <div id="result_indicator" class="row">
      <button class="go" disabled>You Win</button>
    </div>

    <div id="guess_result_amount" class="row">
      <img src="images/chip.svg"> <span>+250</span>
    </div>
  `
}

function lotteryInfoLoseTemplate () { // eslint-disable-line no-unused-vars
  return `
    <div id="result_indicator" class="row">
      <button disabled>You Lose</button>
    </div>

    <div id="guess_result_amount" class="row">
      <img src="images/chip.svg"> <span>-250</span>
    </div>
  `
}

function loadLotteryResultRoom (err) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = lotteryResultTemplate()
  load(err)
  // Load response
  setTimeout(function () {
    document.getElementById('guess_amount').innerText = '1' + '00415' // Always add an 1 after the 6 digits number
  }, 300)
  // Show status
  setTimeout(function () {
    document.getElementById('result_head_img').src = WINNER_IMG
    document.getElementById('result_info').innerHTML = lotteryInfoWinTemplate()
  }, 2300)
  document.getElementById('back-div').addEventListener('click', function () {
    routes('lottery_pick_room', function (next) {
      next('')
    })
  })
  
}

window.odometerOptions = {
  format: 'd'
};