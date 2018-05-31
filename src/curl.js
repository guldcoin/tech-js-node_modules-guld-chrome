// Semi-smart curl for simple fetching
module.exports = async function (uri, settings) {
  settings = settings || {}
  if (uri.indexOf('github.com') >= 0 && 
    this.observer.hosts && 
    this.observer.hosts.github &&
    this.observer.hosts.github.auth &&
    this.observer.hosts.github.auth.password &&
    this.observer.hosts.github.auth.password && !settings.hasOwnProperty('headers')
  ) {
    var heads = {
      'authorization': `token ${this.observer.hosts.github.auth.password}`,
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

