if (typeof Buffer === 'undefined' && typeof buffer !== 'undefined' && typeof buffer.Buffer !== 'undefined') var Buffer = buffer.Buffer

function depromise (p, cb) {
  if (cb) {
    p.then(resp => {
      cb(null, resp)
    }).catch(err => {
      cb(err)
    })
  } else return p
}

class ChromeStorageFSError extends Error {
  constructor (message, code) {
    super(message)
    this.name = 'ChromeStorageFSError'
    this.code = code || 'EIO'
  }
}

class FSStats {
  constructor (data) {
    this.data = data
  }
  isBlockDevice () {
    return false
  }
  isCharacterDevice () {
    return false
  }
  isDirectory () {
    return Array.isArray(this.file)
  }
  isFIFO () {
    return false
  }
  isFile () {
    return (!Array.isArray(this.file) && typeof this.file !== 'undefined')
  }
  isSocket () {
    return false
  }
  isSymbolicLink () {
    return false
  }
}

class ChromeStorageFS {
  constructor (stype) {
    this.stype = stype || 'local'
    this.store = chrome.storage[this.stype]
  }

  // helpers
  initialize () {
    return this.readdir('/').then(l => {
      if (!(l) || !(l.length)) {
        return this.mkdir('/')
      }
    }).catch(e => {
      return this.mkdir('/')
    })
  }

  set (path, data, cb) {
    return depromise(new Promise((resolve, reject) => {
      if (!Array.isArray(data)) data = data.toString()
//      data = JSON.stringify(data)
      this.store.set({[path]: data}, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    }), cb)
  }

  get (path, encoding, cb) {
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, path.length-1)
    return depromise(new Promise((resolve, reject) => {
      this.store.get(path, data => {
        if (data && data[path]) {
//          try {
//            resolve(JSON.parse(data[path]))
          if (!Array.isArray(data[path]) && typeof encoding === 'undefined')
            resolve(Buffer.from(data[path]))
          else if (encoding) {
            resolve(data[path].toString(encoding))
          } else {
//          } catch (err) {
            resolve(data[path])
          }
        } else if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          reject(new Error(`${path} is not found`))
        }
      })
    }), cb)
  }

  rm (path, cb) {
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, path.length-1)
    return depromise(new Promise((resolve, reject) => {
      this.store.remove(path, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    }), cb)
  }

  addToDir (path) {
    var dirname = `${path.slice(0, path.lastIndexOf('/'))}/`
    var filename = path.slice(path.lastIndexOf('/') + 1)
    return this.get(dirname).then(l => {
      if (typeof l === 'undefined') throw new RangeError(`${dirname} is not a directory.`)
      if (l.indexOf(filename) === -1) {
        l.push(filename)
        return this.set(dirname, l)
      }
    })
  }

  // File system implementation
  appendFile (path, data, encoding, mode, flag, cb) {
    if (typeof cb === 'undefined') {
      if (typeof mode === 'undefined') {
        if (typeof flag === 'undefined') {
          if (typeof encoding !== 'undefined') {
            cb = encoding
          }
        } else cb = flag
      } else cb = mode
    }
    return depromise(this.get(path, encoding).then((contents) => {
      return this.writeFile(path, contents + data)
    }).catch(e => {
      return this.writeFile(path, data)
    }), cb)
  }
  chmod (path, mode, cb) {
    cb(new Error('Function Not Supported'))
  }
  chown (path, uid, gid, cb) {
    cb(new Error('Function Not Supported'))
  }
  link (srcpath, dstpath, cb) {
    cb(new Error('Function Not Supported'))
  }
  lstat (path, cb) {
    depromise(this.get(path).then(contents => {
      return new FSStats(contents)
    }), cb)
  }
  mkdir (path, mode, cb) {
    if (typeof cb === 'undefined') cb = mode
    return depromise(this.get(path).then(l => {}).catch(e => {
      this.set(path, []).then(() => {
//        var i = path.lastIndexOf('/')
//        if (i > 0 ) return this.mkdir(path.slice(0, i), mode, cb)
      })
    }), cb)
  }
  open (path, flag, mode, cb) {
    cb(new Error('Function Not Supported'))
  }
  openFile (path, flag, cb) {
    cb(new Error('Function Not Supported'))
  }
  readdir (path, cb) {
    return depromise(this.get(path), cb)
  }
  readFile (path, encoding, flag, cb) {
    if (typeof cb === 'undefined') {
      if (typeof flag === 'undefined') {
        if (typeof encoding !== 'undefined') {
          cb = encoding
        }
      } else cb = flag
    }
    return depromise(this.get(path, encoding), cb)
  }
  readlink (path, cb) {
    cb(new Error('Function Not Supported'))
  }
  realpath (path, cache, cb) {
    cb(new Error('Function Not Supported'))
  }
  rename (oldPath, newPath, cb) {
    cb(new Error('Function Not Supported'))
  }
  rmdir (path, cb) {
    return this.rm(path, cb)
  }
  stat (path, cb) {
    return this.lstat(path, cb)
  }
  symlink (srcpath, dstpath, type, cb) {
    cb(new Error('Function Not Supported'))
  }
  truncate (path, len, cb) {
    cb(new Error('Function Not Supported'))
  }
  unlink (path, cb) {
    return this.rm(path, cb)
  }
  utimes (p, atime, mtime, cb) {
    cb(new Error('Function Not Supported'))
  }
  writeFile (path, data, encoding, flag, mode, cb) {
    if (typeof cb === 'undefined') {
      if (typeof mode === 'undefined') {
        if (typeof flag === 'undefined') {
          if (typeof encoding !== 'undefined') {
            cb = encoding
          }
        } else cb = flag
      } else cb = mode
    }
    return depromise(this.set(path, data).then(() => {
      return this.addToDir(path)
    }), cb)
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    ChromeStorageFS: ChromeStorageFS
  }
} // Otherwise assume we're in a browser environment
