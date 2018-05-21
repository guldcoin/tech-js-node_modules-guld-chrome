const {getCachedDiv} = require('../util.js')
let loadingDiv
let loadingMessage

function loadAllDivs () {
  getCachedDiv(loadingDiv, 'loading-div')
  getCachedDiv(loadingMessage, 'loader-wait-msg')
}

module.exports.setLoading = (mess) => {
  loadAllDivs()
  loadingDiv.style.display = 'block'
  if (mess) {
    loadingMessage.innerHTML = mess
  } else {
    loadingMessage.innerHTML = 'Please wait.'
  }
}

module.exports.setNotLoading = () => {
  loadAllDivs()
  loadingMessage.innerHTML = 'Please wait.'
  loadingDiv.style.display = 'none'
}
