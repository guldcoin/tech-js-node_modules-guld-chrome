'use strict'

/* global b:false loadBackground:false logout:false */

function loadSend () { // eslint-disable-line no-unused-vars
  setupPage()
  senderDiv = document.getElementById('guld_transaction_sender')
  recDiv = document.getElementById('guld_transaction_recipient')
  amtDiv = document.getElementById('guld_spend_amount')
  var formEl = document.getElementById('guld_transfer_form')
  senderDiv.value = b.guldname

  detectCommodity()
  showBalances(b.guldname, commodity)

  b.getBalance().then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      amtDiv.max = bal.Assets.__bal[commodity].value.toString()
      balance = bal.Assets.__bal[commodity].value
    }
  })

  senderDiv.addEventListener('focusout', validateSender)
  recDiv.addEventListener('focusout', validateRecipient)
  amtDiv.addEventListener('change', validateSpendAmount)
  formEl.addEventListener('submit', e => {
    e.preventDefault()
    if (validateSpendAmount()) {
      validateSender().then(valid => {
        if (valid) {
          validateRecipient().then(valid => {
            if (valid) {
              var time = Math.trunc(Date.now() / 1000)
              var tx = Transfer.create(senderDiv.value, recDiv.value, amtDiv.value, commodity, time)
              var repoDir = `/BLOCKTREE/${b.guldname}/ledger/${commodity}/${senderDiv.value}/`
              b.fs.mkdir(repoDir, err => {
                var repo = {
                  fs: b.fs,
                  dir: repoDir,
                  gitdir: `${repoDir}.git`
                }
                b.fs.writeFile(`${repoDir}${time}.dat`, tx.raw, err => {
                  if (err) setError(err)
                  else {
                    var addRepo = Object.assign({filepath: `${time}.dat`}, repo)
                    b.git.add(addRepo).then(() => {
                      // TODO commit and sign
                      /*
                      var commitRepo = Object.assign( 
                        {
                          message: `transfer`,
                          author: {
                            name: b.fullname,
                            email: b.guldmail,
                            date: new Date(time * 1000),
                            timestamp: time
                          }
                        },
                        repo
                      )
                      console.log(commitRepo)
                      b.git.commit(commitRepo).then(hash => {
                        console.log(`created commit ${hash}`)
                      }).catch(console.error)
                      */
                      b.getLedger().then(ledger => {
                        var newJournal = `${ledger.options.raw}

${tx.raw}
`
                        chrome.storage.local.set({'journal': newJournal}, () => {
                          if (chrome.runtime.lastError) setError(chrome.runtime.lastError)
                          else {
                            b.getBalance(b.guldname, false).then(bal => {
                              balance = bal
                              window.location = `chrome-extension://${chrome.runtime.id}/main.html`
                            })
                          }
                        })
                      })
                    })
                  }
                })
              })
            }
          })
        }
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadSend)
})
