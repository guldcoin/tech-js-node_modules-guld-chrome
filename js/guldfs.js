/* global BrowserFS:false Event:false Blocktree:true */
const config = {
  fs: 'LocalStorage',
  options: {
    '/tmp': {
      fs: 'InMemory'
    }
  }
}
var fs = false
var blocktree = false
var start = Date.now()
BrowserFS.configure(config, err => {
  if (err) throw err
  fs = BrowserFS.BFSRequire('fs')
  blocktree = new Blocktree(fs, 'gg')
  window.dispatchEvent(new Event('blocktree-avail'))
  blocktree.initFS('gg', 'guld-games').then(() => {
    console.log(`${(Date.now() - start) / 1000} seconds to load blocktree`)
  })
})
