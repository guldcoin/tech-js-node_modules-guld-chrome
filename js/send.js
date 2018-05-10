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
      validateSender().then(avail => {
        if (avail === false) {
          validateRecipient().then(avail => {
            if (avail === false) {
              console.log(`send ${amount.toString()} from ${senderDiv.value} to ${recDiv.value}`)
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
