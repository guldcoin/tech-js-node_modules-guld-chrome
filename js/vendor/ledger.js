/* global highland:false Amount:false Account:false Balance:false Papa:false spawn:false chrome:false */

class Ledger { // eslint-disable-line no-unused-vars
  constructor (options) {
    this.options = Object.assign({
      binary: '/usr/bin/ledger',
      debug: false
    }, options)
    this.cli = new Cli(this.options.binary, {
      debug: this.options.debug
    })
  }

  // Static methods and properties.

  static trim (str) {
    return str.replace(/^\s+|\s+$/g, '')
  }

  // `ledger balance` output format to allow parsing as a CSV string
  static formatBalance () {
    return '%(quoted(display_total)),%(quoted(account))\n%/'
  }

  static initialFormat () {
    return [
      '%(quoted(date))',
      '%(effective_date ? quoted(effective_date) : "")',
      '%(code ? quoted(code) : "")',
      '%(cleared ? "true" : "false")',
      '%(pending ? "true" : "false")',
      '%(quoted(payee))',
      '%(quoted(display_account))',
      '%(quoted(amount))'
    ]
  }

  static subsequentFormat () {
    return [
      '%(quoted(display_account))',
      '%(quoted(amount))'
    ]
  }

  // Parse an amount from a given string that looks like one of the following
  // cases:
  //   £-1,000.00
  //   5 STOCKSYMBOL {USD200}
  //   -900.00 CAD {USD1.1111111111} [13-Mar-19]
  static parseCommodity (data) {
    // Strip out unneeded details.
    data = data.toString()
    data = data.replace(/{.*}/g, '')
    data = data.replace(/\[.*\]/g, '')
    data = data.trim()

    // Find the amount first.
    var amountMatch = data.match(/-?[0-9,.]+/)
    if (amountMatch == null) {
      throw new TypeError(`Could not get amount from string: ${data}`)
    }
    var amountString = amountMatch[0]

    // Strip commas and parse amount as an Amount.
    var amount = new Amount(amountString.replace(/,/g, ''), data.replace(amountString, '').trim())
    return amount
  }

  /*
   top level command handlers
  */

  // version reports the current installed Ledger version.
  version () {
    var p = this.cli.exec(['--version'])

    return p.then(pro => {
      return pro.compact().toPromise(Promise).then(v => {
        var matches = v.toString().match(/Ledger (.*),/)
        if (matches) return matches[1]
        else throw new Error('Failed to match Ledger version')
      })
    })
  }

  // The accounts command displays the list of accounts used in a Ledger file.
  accounts () {
    var p = this.withLedgerFile(this.cli).exec(['accounts'])
    return p.then(pro => {
      return pro.invoke('toString', []).split().compact()
    })
  }

  // balance reports the current balance of all accounts.
  balance (options) {
    var args = ['balance', '--flat', '--format', Ledger.formatBalance()]

    options = options || {}
    if (options.collapse) {
      args.push('--collapse')
    }

    if (options.market) {
      args.push('--market')
    }

    if (options.depth) {
      args.push('--depth')
      args.push(options.depth)
    }

    if (options.query) {
      args.push(options.query)
    }
    var p = this.withLedgerFile(this.cli).exec(args)
    var account = new Account(null)
    var amtQueue = []

    return new Promise((resolve, reject) => {
      p.then(pro => {
        highland(pro)
          .split()
          .each(s => {
            if (typeof s === 'string' && s.length > 0) {
              if (!s.startsWith('"')) { s = `"${s}` }
              if (!s.endsWith('"')) { s = `${s}"` }
              var data = Papa.parse(s).data
              data.forEach(line => {
                if (line.length === 1) { amtQueue.push(line) }
                if (line.length > 1) {
                  var bal = new Balance({})
                  bal = bal.add(Ledger.parseCommodity(line[0]))
                  account._add(bal, line[1].split(':'))
                  if (amtQueue.length > 0) {
                    amtQueue.forEach(amt => {
                      bal = new Balance({})
                      bal = bal.add(Ledger.parseCommodity(amt))
                      account._add(bal, line[1].split(':'))
                    })
                    amtQueue = []
                  }
                } else return highland.nil
              })
            } else {
              resolve(account)
              return highland.nil
            }
          })
      })
    })
  }

  // register displays all the postings occurring in a single account.
  register (options) {
    var args = ['register']
    options = options || {}

    // Allow filtering by a given account name
    if (options.account) {
      args.push(`^${options.account}`)
    }

    args.push('--format')
    args.push(`${Ledger.initialFormat().join(',')}\n%/,,,,,,${Ledger.subsequentFormat().join(',')}\n%/`)

    var p = this.withLedgerFile(this.cli).exec(args)

    function toDate (str) {
      if (str.length === 0) return null
      var date = str.split('/')
      return Date.UTC(date[0], parseInt(date[1], 10) - 1, parseInt(date[2], 10))
    }

    var last = {
      date: null,
      effectiveDate: null,
      code: null,
      cleared: false,
      pending: true,
      payee: null,
      postings: []
    }

    var lastParsed = null

    var lastPs = []

    return new Promise((resolve, reject) => {
      resolve(p.then(pro => {
        return pro.split()
          .compact()
          .map(s => {
            var data = Papa.parse(s, {escapeChar: '\\'}).data[0]
            var amount = Ledger.parseCommodity(data[7])
            var bal = new Balance(amount)
            var accounts = data[6].split(':')
            var acct = new Account()
            acct._add(bal, accounts)
            if (data[0].length !== 0) {
              last = {
                date: toDate(data[0]),
                effectiveDate: toDate(data[1]),
                code: data[2],
                cleared: data[3] === 'true',
                pending: data[4] === 'true',
                payee: data[5],
                postings: [acct]
              }
            } else {
              last.postings.push(acct)
            }
            return last
          })
          .consume((err, data, push, next) => {
            if (err) {
              push(err)
              next()
            } else if (Object.keys(data).length === 0) {
              push(null, lastParsed)
              push(null, highland.nil)
            } else if (lastParsed && (
              data.date !== lastParsed.date ||
                data.effectiveDate !== lastParsed.effectiveDate ||
                data.code !== lastParsed.code ||
                data.cleared !== lastParsed.cleared ||
                data.pending !== lastParsed.pending ||
                data.payee !== lastParsed.payee ||
                JSON.stringify(data.postings) !== JSON.stringify(lastPs.concat([data.postings[data.postings.length - 1]]))
            )) {
              push(null, lastParsed)
              lastParsed = data
              lastPs = lastParsed.postings.concat([])
              next()
            } else {
              lastParsed = data
              lastPs = lastParsed.postings.concat([])
              next()
            }
          })
      }))
    })
  }

  // print returns a readable stream that outputs the Ledger file 'pretty printed'
  print () {
    var p = this.withLedgerFile(this.cli).exec(['print', '--sort', 'd'])
    return p.then(process => {
      return process.stdout
    })
  }

  // stats returns statistics, like number of unique accounts
  stats (callback) {
    var p = this.withLedgerFile(this.cli).exec(['stats'])

    var data = ''
    var errored = false

    p.then(process => {
      process.stdout.on('data', function (chunk) {
        data += chunk
      })

      process.stdout.once('end', function () {
        if (errored) {
          return
        }
        var stats = null
        var split = data.toString().split('\n')
        var files = data.match(/Files these postings came from:([^]*?)(\r?\n){2}/)

        split.forEach(function (el) {
          var prop = el.trim().match(/^(.*):[\s]+(.*)$/)
          if (prop) {
            if (stats === null) {
              stats = {}
            }
            stats[prop[1]] = prop[2]
          }
        })

        if (files) {
          if (stats === null) {
            stats = {}
          }

          // convert files[1] == paths capture to array and remove empty entries
          stats.files = files[1].split('\n').map(function (entry) {
            return entry.trim()
          }).filter(Boolean)
        }

        if (stats !== null) {
          callback(null, stats)
        } else {
          callback(new Error('Failed to parse Ledger stats'))
        }
      })

      process.stderr.once('data', function (error) {
        errored = true
        callback(error)
      })
    })
  }

  withLedgerFile (cli) {
    var file = ['-f']
    var stdin
    if (this.options.hasOwnProperty('raw')) {
      file.push('-')
      stdin = this.options.raw
    } else file.push(this.options.file)

    return {
      exec: function (args) {
        return cli.exec(file.concat(args || []), stdin)
      }
    }
  }
}

class Cli {
  constructor (command, options) {
    this.command = command
    this.options = Object.assign({
      binary: '/usr/bin/ledger',
      debug: false
    }, options)
    if (typeof chrome !== 'undefined' && command === 'chrome') this.spawn = this.chromeSpawn
    else this.spawn = this.nodeSpawn
  }

  exec (args, stdin) {
    var process = this.spawn(args, stdin)

    if (this.options.debug) {
      this.logging(process)
    }

    return process
  }

  chromeSpawn (args, stdin) {
    this.log(`${this.command} ${args.join(' ')}`)

    return new Promise((resolve, reject) => {
      chrome.runtime.sendNativeMessage('com.guld.ledger',
        {'cmd': args.join(' '), 'stdin': stdin},
        response => {
          if (!response) {
            reject(chrome.runtime.lastError)
          } else {
            response = JSON.parse(response)
            if (response.error && response['error'].length != 0) {
              reject(response.error)
            } else {
              resolve(highland([response['output']]))
            }
          }
        }
      )
    })
  }

  nodeSpawn (args, stdin) {
    this.log(`${this.command} ${args.join(' ')}`)

    var process = spawn(this.command, args)

    if (stdin) {
      process.stdin.write(stdin)
      process.stdin.end('\n')
    }
    process.stdout.setEncoding('utf8')
    process.stderr.setEncoding('utf8')

    var resp = highland()

    return new Promise((resolve, reject) => {
      process.stdout.on('data', data => {
        if (highland.nil !== data) resp.write(data)
      })
      process.stdout.on('end', () => {
        resp.end()
        resolve(resp)
      })
      process.stderr.on('data', error => {
        reject(error)
      })
    })
  }

  logging (process) {
    var log = this.log.bind(this)

    process.stdout.on('data', function (data) { log(`stdout: ${data}`) })
    process.stderr.on('data', function (error) { log(`stderr: ${error}`) })
    process.once('close', function (code) { log(`child process exited with code ${code}`) })
  }

  log (msg) {
    if (this.options.debug) {
      console.log(msg) // eslint-disable-line no-console
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    Ledger: Ledger
  }
} // Otherwise assume we're in a browser environment
