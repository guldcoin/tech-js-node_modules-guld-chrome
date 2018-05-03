'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false BACK_TEMPLATE:false load:false routes:false */

const LOTTERY_ROOM_TEMPLATE = // eslint-disable-line no-unused-vars
    `${TOP_MENU_TEMPLATE}
    <div id="white_bg">
      <h1 class="text-center">Lottery</h1>

      <div id="create_lottery_rooms" class="row">
        <button id="create_lottery_room" class="secondary grouped" value="create">Create</button>
        <div id="lottery_room_creation" class="text-center">
          <input id="lottery_room_name" type="text" placeholder="Name of the game" autofocus></input>
          <div class="notice">Enter maximum number between 1 to 65535</div>
          <input id="lottery_lucky_number" type="number" placeholder="Lucky number"></input>
          <div id="bet">
            Bet Amount
            <input id="lottery_bet_amount" type="text"></input>
          </div>
          <button>Create</button>
        </div>
      </div>

      <div id="join_lottery_rooms" class="row">
        <button id="join_lottery_room" class="grouped" value="join">Join</button>
        <div id="lottery_room_list" class="text-left">
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
          <div class="room">Lorem ipsum dolor<button>Join</button></div>
        </div>
      </div>

      ${ERR_TEMPLATE}
      ${BACK_TEMPLATE}
    </div>`

function loadLotteryPickRoom (err, key, passphrase) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = LOTTERY_ROOM_TEMPLATE
  load(err)
  document.getElementById('back-div').addEventListener('click', function () {
    routes('dash', function (next) {
      next('', key, passphrase)
    })
  })
}
