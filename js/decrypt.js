'use strict'

/* global routes:false */

function decryptKey (err, key, passphrase) { // eslint-disable-line no-unused-vars
  if (err) throw err
  else if (key.hasOwnProperty('key')) key = key.key
  routes('github', function (next) {
    key.decrypt(passphrase).then(function (result) {
      next('', key, passphrase)
    }, function (err) {
      routes('login', function (back) {
        back(err)
      })
    })
  })
}
