/* global chrome:false */

var b
var errdiv

function loadBackground () { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    chrome.runtime.getBackgroundPage(bkg => {
      b = bkg
      function setInitListener () {
        if (b.blocktree.initialized) resolve()
        else {
          b.blocktree.on('initialized', (e) => {
            resolve()
          })
        }
      }
      if (!b.blocktree) {
        b.addEventListener('blocktree-avail', (e) => {
          setInitListener()
        })
      } else setInitListener()
    })
  })
}

function setError (errmess) { // eslint-disable-line no-unused-vars
  errdiv.innerHTML = `${errmess}${errdiv.innerHTML}`
}

function unsetError (errmess) { // eslint-disable-line no-unused-vars
  errdiv.innerHTML = errdiv.innerHTML.replace(errmess, '')
}

