class FSStats {

}

class ChromeStorageFS {
  constructor (stype) {
    this.stype = style || 'local'
    this.store = chrome.storage[stype]
  }
  appendFile (path, data, encoding, mode, flag, cb) {
  }
  appendFileSync (path, data, encoding, mode, flag) {
    const fd = this.openSync(fname, flag, mode)
  }
  chmod (path, mode, cb) {
    cb(new Error('Function Not Supported'))
  }
  chmodSync (path, mode) {
    throw new Error('Function Not Supported')
  }
  chown (path, uid, gid, cb) {
    cb(new Error('Function Not Supported'))
  }
  chownSync (path, uid, gid) {
    throw new Error('Function Not Supported')
  }
  link (srcpath, dstpath, cb) {
    cb(new Error('Function Not Supported'))
  }
  linkSync (srcpath, dstpath) {
    throw new Error('Function Not Supported')
  }
  mkdir (p, mode, cb) {
    cb(new Error('Function Not Supported'))
  }
  mkdirSync (p, mode) {
    throw new Error('Function Not Supported')
  }
  open (p, flag, mode, cb) {
    this.stat(p, false, mustBeFile)
  }
  openSync (p, flag, mode) {
  }
  openFile (p, flag, cb) {
  }
  openFileSync (p, flag, mode) {
    throw new Error('Function Not Supported')
  }
  readdir (p, cb) {
    cb(new Error('Function Not Supported'))
  }
  readdirSync (p) {
    throw new Error('Function Not Supported')
  }
  readFile (fname, encoding, flag, cb) {
  }
  readFileSync (fname, encoding, flag) {
  }
  readlink (p, cb) {
    cb(new Error('Function Not Supported'))
  }
  readlinkSync (p) {
    throw new Error('Function Not Supported')
  }
  realpath (p, cache, cb) {
  }
  realpathSync (p, cache) {
  }
  rename (oldPath, newPath, cb) {
    cb(new Error('Function Not Supported'))
  }
  renameSync (oldPath, newPath) {
    throw new Error('Function Not Supported')
  }
  rmdir (p, cb) {
    cb(new Error('Function Not Supported'))
  }
  rmdirSync (p) {
    throw new Error('Function Not Supported')
  }
  stat (p, isLstat, cb) {
    cb(new Error('Function Not Supported'))
  }
  statSync (p, isLstat) {
    throw new Error('Function Not Supported')
  }
  symlink (srcpath, dstpath, type, cb) {
    cb(new Error('Function Not Supported'))
  }
  symlinkSync (srcpath, dstpath, type) {
    throw new Error('Function Not Supported')
  }
  truncate (p, len, cb) {
  }
  truncateSync (p, len) {
  }
  unlink (p, cb) {
    cb(new Error('Function Not Supported'))
  }
  unlinkSync (p) {
    throw new Error('Function Not Supported')
  }
  utimes (p, atime, mtime, cb) {
    cb(new Error('Function Not Supported'))
  }
  utimesSync (p, atime, mtime) {
    throw new Error('Function Not Supported')
  }
  writeFile (fname, data, encoding, flag, mode, cb) {
  }
  writeFileSync (fname, data, encoding, flag, mode) {
  }
}
