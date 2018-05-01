'use strict';

if (typeof window == 'undefined' || !(window.openpgp)) {
    throw new ReferenceError("Openpgp is not avilable.")
}
const keyring = new openpgp.Keyring();

const err_template = `<div id="err-div" class="row"> </div>`;
const logo_template = `<img id="logo" src="images/logo.svg" alt="Guld Games" width="60%">`;
const footer_template = `
    <div id="footer_menu">
    </div>`;
const footer_items_template = `
    <div class="menu_btn"><img src="images/footer_menu/wallet.svg"><div class="name">wallet</div></div>
    <div id="games_tab" class="menu_btn"><img src="images/footer_menu/games.svg"><div class="name">games</div></div>
    <div id="keys_tab" class="menu_btn"><img src="images/footer_menu/keys.svg"><div class="name">keys</div></div>
    <div id="hosts_tab" class="menu_btn"><img src="images/footer_menu/hosts.svg"><div class="name">hosts</div></div>
    `;

var active_tab = "games";

function load(err, key, passphrase) {
    document.getElementById("err-div").innerHTML = `<p class="error">` + err + `</p>`;
    // Footer menu
    if (keyring.privateKeys.keys.length > 0) {
        document.getElementById("footer_menu").innerHTML = footer_items_template;

        document.getElementById("games_tab").addEventListener("click", function() {
            active_tab = "games";
            routes("dash", function (next) {
                next("", key, passphrase);
            });
        });

        document.getElementById("keys_tab").addEventListener("click", function() {
            active_tab = "keys";
            routes("generate", function (next) {
                next("", key, passphrase);
            });
        });

        document.getElementById("hosts_tab").addEventListener("click", function() {
            active_tab = "hosts";
            routes("github", function (next) {
                next("", key, passphrase);
            });
        });

        if (active_tab == "games") {
            document.getElementById("games_tab").classList.add("active");
        } else if (active_tab == "keys") {
            document.getElementById("keys_tab").classList.add("active");
        } else if (active_tab == "hosts") {
            document.getElementById("hosts_tab").classList.add("active");
        }


    }
    
}

function gpg_sign(key, message) {
    options = {
        data: message,
        privateKeys: [key],
        detached: true
    };
    openpgp.sign(options).then(function (signed) {
        // var cleartext = signed.data;
        // console.log(cleartext)
        // TODO return Promise
        console.log(signed.signature)
    });
}

function curl(url, settings, next, error) {
    fetch(url, settings).then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error("Could not reach the API: " + response.statusText);
        }
    }).then(function (data) {
        next(data);
    }).catch(function (e) {
        error(e.message);
    });

}