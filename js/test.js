//BrowserFS.configure({
//  fs: 'ChromeStorage',
//  options: {
//    'storeType': 'local'
//  }
//}, err => {
//  if (err) {
//    console.error(JSON.stringify(err))
//    throw err
//  }
//  fs = BrowserFS.BFSRequire('fs')
//  fs.readdir('/', (err, list) => {
//    if (err) {
//      throw err      
//    }
//    console.log(list)
//  })
//})

var fs = new ChromeStorageFS('local')
fs.readdir('/', (err, list) => {
  if (err) {
    throw err      
  }
  console.log(list)
})

