const {getCachedDiv} = require('../views.js')

module.exports.setError = function (errmess) {
  if (getCachedDiv('err-div').innerHTML.indexOf(errmess) === -1) {
    getCachedDiv('err-div').innerHTML = `${errmess}${errdiv.innerHTML}`
  }
}

module.exports.unsetError = function (errmess) {
  getCachedDiv('err-div').innerHTML = getCachedDiv('err-div').innerHTML.replace(new RegExp(errmess, 'g'), '')
}

module.exports.clearError = function () {
  getCachedDiv('err-div').innerHTML = ''
}
