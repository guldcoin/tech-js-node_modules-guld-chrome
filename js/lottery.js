'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false load:false */

const LOTTERY_ROOM_TEMPLATE = // eslint-disable-line no-unused-vars
    `${TOP_MENU_TEMPLATE}
    <div id="white_bg">
      <h1 class="text-center">Lottery</h1>

      <div class="row">
        <button id="create_lottery_room" class="secondary grouped" value="create">Create</button>
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
    </div>`

function loadLotteryPickRoom (err) { // eslint-disable-line no-unused-vars
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML = LOTTERY_ROOM_TEMPLATE
  load(err)
}
