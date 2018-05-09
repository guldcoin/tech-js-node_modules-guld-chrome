'use strict'

/* global LOGO_TEMPLATE:false ERR_TEMPLATE:false keyring:false load:false routes:false LOADING_TEMPLATE:false wrapper:true b:true initGitHub:false ghOAUTH:false openpgp:false myKey:true Event:false manifest:true USER:true */

function loadWallet () { // eslint-disable-line no-unused-vars
}

document.addEventListener('DOMContentLoaded', function () {
  loadBackground().then(loadWallet)
})
