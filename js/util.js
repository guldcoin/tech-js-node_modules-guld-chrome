'use strict'

/* global openpgp:false fetch:false */

if (typeof window === 'undefined' || !(window.openpgp)) {
  throw new ReferenceError('Openpgp is not avilable.')
}
const keyring = new openpgp.Keyring() // eslint-disable-line no-unused-vars

const ERR_TEMPLATE = `<div id="err-div" class="row"> </div>` // eslint-disable-line no-unused-vars
const LOGO_TEMPLATE = // eslint-disable-line no-unused-vars
    `<img id="logo" src="images/logo.svg" alt="Guld Games" width="60%">`

function load (err) { // eslint-disable-line no-unused-vars
  document.getElementById('err-div').innerHTML = `<p class="error">${err
  }</p>`
}

function gpgSign (key, message) { // eslint-disable-line no-unused-vars
  var options = {
    data: message,
    privateKeys: [key],
    detached: true
  }
  openpgp.sign(options).then(function (signed) {
    // var cleartext = signed.data;
    // console.log(cleartext)
    // TODO return Promise
    console.log(signed.signature) // eslint-disable-line no-console
  })
}

function curl (url, settings, next, error) { // eslint-disable-line no-unused-vars
  fetch(url, settings).then(function (response) {
    if (response.ok) {
      return response.json()
    } else {
      throw new Error(`Could not reach the API: ${response.statusText}`)
    }
  }).then(function (data) {
    next(data)
  }).catch(function (e) {
    error(e.message)
  })
}
