'use strict'

/* global routes:false */

function decrypt (goto, key, passphrase) {
  routes(goto, function (next) {
    key.decrypt(passphrase).then(function (result) {
      next('', key, passphrase)
    }, function (err) {
      routes('login', function (back) {
        back(err)
      })
    })
  })
}

function decryptKey (err, key, passphrase) { // eslint-disable-line no-unused-vars
  if (err) throw err
  else if (key.hasOwnProperty('key')) key = key.key
  chrome.storage.local.get('gh', function (data) {
    if (typeof data.gh === 'undefined') {
      decrypt('github', key, passphrase)
    } else {
      decrypt('dash', key, passphrase)
    }
  })
}
