const {getCachedDiv} = require('../util.js')
let errdiv

module.exports.setError = (errmess) => {
  getCachedDiv(errdiv, 'err-div')
  if (errdiv.innerHTML.indexOf(errmess) === -1) {
    errdiv.innerHTML = `${errmess}${errdiv.innerHTML}`
  }
}

module.exports.unsetError = (errmess) => {
  getCachedDiv(errdiv, 'err-div')
  errdiv.innerHTML = errdiv.innerHTML.replace(new RegExp(errmess, 'g'), '')
}

module.exports.clearError = () => {
  getCachedDiv(errdiv, 'err-div')
  errdiv.innerHTML = errdiv.innerHTML = ''
}
