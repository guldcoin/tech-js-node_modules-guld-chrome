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
        next(function () {
            loadGenerate();
        });
    } else if (to == "github") {
        next(function (key, passphrase) {
            decryptKeyThenGithub(key, passphrase);
        });
    } else if (to == "gamelist") {
        next(function () {
            loadGameList();
        });
    } else {
        next(function () {
            loadLogin();
        });
    }
}