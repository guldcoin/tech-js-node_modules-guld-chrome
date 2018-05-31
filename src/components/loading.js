const {getCachedDiv} = require('../views.js')

module.exports.setLoading = function (mess) {
  getCachedDiv('loading-div').style.display = 'block'
  if (mess) {
    getCachedDiv('loader-wait-msg').innerHTML = mess
  } else {
    getCachedDiv('loader-wait-msg').innerHTML = 'Please wait.'
  }
}

module.exports.setNotLoading = function () {
  getCachedDiv('loader-wait-msg').innerHTML = 'Please wait.'
  getCachedDiv('loading-div').style.display = 'none'
}
