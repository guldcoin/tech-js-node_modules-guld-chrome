const QRCode = require('qrcode')

module.exports.load = () => {
  new QRCode(document.getElementById('qrcode'), 'http://guld.io')
}
