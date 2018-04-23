'use strict';

if (typeof window == 'undefined' || ! (window.openpgp)) {
  throw new ReferenceError("Openpgp is not avilable.")
}
const keyring = new openpgp.Keyring();

function gpg_sign(key, message) {
  options = {
    data: message,
    privateKeys: [key],
    detached: true
  };
  openpgp.sign(options).then(function(signed) {
    // var cleartext = signed.data;
    // console.log(cleartext)
    // TODO return Promise
    console.log(signed.signature)
  });
}
