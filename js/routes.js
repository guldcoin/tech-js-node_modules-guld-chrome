'use strict';

const loading_template = `
<div class="row text-center">
    Loading...
</div>
`;

function routes(to, next) {
    var wrapper = document.getElementById("wrapper");
    wrapper.innerHTML = loading_template;

    if (to == "generate") {
        next(function (err) {
            loadGenerate(err);
        });
    } else if (to == "decrypt") {
        next(function (err, key, passphrase) {
            decryptKey(err, key, passphrase);
        });
    } else if (to == "github") {
        next(function (err, key, passphrase) {
            loadGithub(err, key, passphrase);
        });
    } else if (to == "gamelist") {
        next(function (err) {
            loadGameList(err);
        });
    } else {
        next(function (err) {
            loadLogin(err);
        });
    }
}