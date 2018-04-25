'use strict';

function decryptKey(err, key, passphrase) {
    if (key.hasOwnProperty('key')) key = key.key;
    routes("github", function (next) {
        key.decrypt(passphrase).then(function (result) {
            next("", key, passphrase)
        }, function (err) {
            routes("login", function (back) {
                back(err);
            });
        })
    });
}