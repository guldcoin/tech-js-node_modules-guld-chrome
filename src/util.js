module.exports.getCachedDiv = (cache, div) => {
  if (typeof cache === 'undefined') cache = document.getElementById(div)
  return cache
}

// Semi-smart curl for simple fetching
module.exports.curl = (uri, settings) => { // eslint-disable-line no-unused-vars
  settings = settings || {}
  if (uri.indexOf('github.com') >= 0 && self.ghoauth && !settings.hasOwnProperty('headers')) {
    var heads = {
      'authorization': `token ${self.ghoauth}`,
      'accept': 'application/json',
      'User-Agent': 'guld app'
    }
    settings['headers'] = heads
    settings['mode'] = 'cors'
  }
  return fetch(uri, settings).then(response => {
    if (response.ok) {
      return response.text()
    } else {
      throw new Error(`Could not reach the API`)
    }
  })
}

