# gg-chrome

Chrome plugin for guld games

To make a browser-based app (in this case, a Chrome extension) work with [`ledger`](http://ledger-cli.org/), a fundamentally command-line oriented application, we've had to patch and/or fork a number of its dependencies. Here's an overview of what it takes to get this extension running.

## Ledger

**Ledger 3.0** is expected to be installed on the host machine. Additionally, these libraries are needed:

* [ledger-cli-browser](https://github.com/isysd/ledger-cli-browser), our rewrite of node-ledger
* [ledger-types](https://github.com/isysd/ledger-types), our new safe math library for JS ledger
* [ledger-native](https://github.com/guldcoin/ledger-native), our native messenger bindings

We are considering making a dedicated ledger extension to manage this connection and data.

## PGP

Only [openpgp.js](https://github.com/openpgpjs/openpgpjs) is required, and no forking is necessary.

We are strongly considering making a standalone key-management extension forked out of the gg extension.

## git

For the most part, [isomorphic-git](https://github.com/isomorphic-git/isomorphic-git) is safe to use. We are currently developing on our own fork, pending the merge of a pull request, or an alternative fix. The project maintainer is very active and communicative, so we are hopeful that we won't need our fork for long.

### guld

We are using the [js-guld-lib](https://github.com/guldcoin/js-guld-lib) library.

## GG-specific

The [GG JavaScript library](https://github.com/guld-games/js-gg-lib) is not published yet.

And of course you're reading about the [GG Chrome extension](https://github.com/guld-games/gg-chrome). :)
