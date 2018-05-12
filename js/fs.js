self.importScripts('vendor/openpgp.min.js')
self.importScripts('vendor/browserfs.js')
self.importScripts('vendor/isomorphic-git.min.js')

var fs = false
var blocktree = false
var gh
var ghcreds // eslint-disable-line no-unused-vars
var keyring = new openpgp.Keyring()

const config = {
  fs: 'IndexedDB',
  options: {
    '/tmp': {
      fs: 'InMemory'
    }
  }
}

BrowserFS.configure({
  fs: 'IndexedDB',
  options: {
    '/tmp': {
      fs: 'InMemory'
    }
  }
}, err => {
  if (err) throw err
  fs = BrowserFS.BFSRequire('fs')
  getGuldID().then(bootstrapBlocktree).catch(bootstrapBlocktree)
})

self.onmessage = function(event) {
	alert("Received message " + event.data);
	doSomething();
}

