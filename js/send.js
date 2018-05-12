'use strict'

/* global b:false loadBackground:false logout:false */

function loadSend () { // eslint-disable-line no-unused-vars
  senderDiv = document.getElementById('guld-transaction-sender')
  recDiv = document.getElementById('guld-transaction-recipient')
  amtDiv = document.getElementById('guld-spend-amount')
  var formEl = document.getElementById('guld-transfer-form')
  senderDiv.value = b.guldname

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
    document.body.className = document.body.className + ' loading'
    if (validateSpendAmount()) {
      validateSender().then(valid => {
        if (valid) {
          validateRecipient().then(valid => {
            if (valid) {
              var time = Math.trunc(Date.now() / 1000)
              var tx = Transfer.create(senderDiv.value, recDiv.value, amtDiv.value, commodity, time)
              b.writeTx(tx, b.guldname, commodity, senderDiv.value, time).then(() => {
                window.location = `chrome-extension://${chrome.runtime.id}/html/main.html`
              }).catch(err => {
                document.body.className = document.body.className.replace(' loading', '')
                setError(err)
              })
            }
          })
        }
      })
    }
  })
}

