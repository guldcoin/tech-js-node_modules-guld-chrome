'use strict'

/* global TOP_MENU_TEMPLATE:false ERR_TEMPLATE:false BACK_TEMPLATE:false load:false routes:false */

var openGames

function lotteryRoomTemplate () { // eslint-disable-line no-unused-vars
  return `${topMenuTemplate()}
    <div class="white_bg">
      <h1 class="text-center">Lottery</h1>

      <div id="create_lottery_rooms" class="row">
        <button id="create_lottery_room" class="secondary grouped" value="create">Create</button>
        <div id="lottery_room_creation" class="text-center">
          <input id="lottery_room_name" type="text" placeholder="Name of the game" autofocus></input>
          <div class="notice">Enter odds between 1 to 65535</div>
          <input id="lottery_odds" type="number" min="1" max="65535" placeholder="Lucky number"></input>
          <div id="bet">
            Bet Amount
            <img src="images/chip.svg">
            <input id="lottery_bet_amount" type="number" min="1" max="${GG_CACHE['bals']['GG']}"></input>
          </div>
          <button class="go" id="create-game">Create</button>
        </div>
      </div>

      <div id="my_lottery_rooms" class="row">
        <button id="my_lottery_room" class="grouped go" value="join">My rooms</button>
        <div id="my_lottery_room_list" class="text-left">
          ${openGames}
        </div>
      </div>

      <div id="join_lottery_rooms" class="row">
        <button id="join_lottery_room" class="grouped" value="join">Join</button>
        <div id="lottery_room_list" class="text-left">
          ${openGames}
        </div>
      </div>

      ${ERR_TEMPLATE}
      ${BACK_TEMPLATE}
    </div>`
}

function loadLotteryPickRoom (err) { // eslint-disable-line no-unused-vars
  listOpenGames().then(games => {
    openGames = games.map(game => {
      return `<div class="room">${game}<button class="go">${game}</button></div>`
    })
    wrapper.innerHTML = lotteryRoomTemplate()
    load(err)
    document.getElementById('back-div').addEventListener('click', function () {
      routes('dash', '')
    })
    function cancelCreate(gname) {
      b.fs.rmdir(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}`, err => {
        load('unable to create game')
      })
    }
    function createGame(bet, odds, gname) {
      b.fs.mkdir(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}`, err => {
        if (err) cancelCreate(gname)
        else {
          b.fs.writeFile(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}/BET.txt`, bet.toString(), err => {
            if (err) cancelCreate(gname)
            else {
              b.fs.writeFile(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}/MAX.txt`, odds.toString(), err => {
                if (err) cancelCreate(gname)
                else {
                  b.fs.writeFile(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}/DEALER.txt`, GG_CACHE['user'], err => {
                    if (err) cancelCreate(gname)
                    else {
                      var secret = Math.random() * odds
                      b.fs.writeFile(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}/SECRET.txt`, secret.toString(), err => {
                        gpgSign(`${gname}:${odds}:${secret}`).then(signature => {
                          b.fs.writeFile(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}/DEALER.sig`, signature, err => {
                            if (err) cancelCreate(gname)
                            loadLotteryPickRoom(`created game ${gname}`)
                            // TODO create transaction
                            // TODO git add, commit, push, and PR
//                            else {
//                              git.
//                            }
                          })
                        }).catch(e => {
                          cancelCreate(gname)
                        })
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
    document.getElementById('create-game').addEventListener('click', function () {
      var bet = document.getElementById('lottery_bet_amount').value
      var odds = document.getElementById('lottery_odds').value
      var gname = document.getElementById('lottery_room_name').value
      if (odds < 1 || odds > 65535) load('invalid odds')
      else if (bet < 1 || bet > GG_CACHE['bals']['GG']) load('invalid bet')
      else {
        b.fs.stat(`/BLOCKTREE/gg/ledger/GG/Games/LOTTERY/${gname}`, (err, stats) => {
          if (err) createGame(bet, odds, gname)
        })
      }
    })

  })
}
