// Semi-smart curl for simple fetching
module.exports = async function (uri, settings) {
  settings = settings || {}
  if (uri.indexOf('github.com') >= 0 && self.hosts[0].auth.username && !settings.hasOwnProperty('headers')) {
    var heads = {
      'authorization': `token ${self.hosts[0].auth.username}`,
      'accept': 'application/json',
      'User-Agent': 'guld app'
    }
    settings['headers'] = heads
    settings['mode'] = 'cors'
  }
  var response = await fetch(uri, settings)
  if (response.ok) {
    return response.text()
  } else {
    throw new Error(`Could not reach the API`)
  }
}

