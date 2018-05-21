const puppeteer = require('puppeteer')
const chai = require('chai')
const fs = require('fs')
const os = require('os')
const HOME = os.homedir()
const path = require('path')
const mkdirp = require('mkdirp')
const pify = require('pify')
const config = require('../test-config.js')
var userDir

const URL = 'chrome-extension://fggohbjlmjldccoelobkepngbkkebefi/html/main.html?view=options'
const args = puppeteer.defaultArgs().filter(arg => String(arg).toLowerCase() !== '--disable-extensions')

var browser
var page
var createRadio

async function setGH () {
  try {
    return await page.evaluate((config) => {
      return chrome.runtime.getBackgroundPage(b => {
        b.ghoauth = config.ghoauth
        b.ghmail = config.ghmail
        b.ghname = config.ghname
        b.ghavatar = config.ghavatar
        b.ghkeyid = config.ghkeyid
      })
    }, config)
  } catch (e) {
    console.error(e)
  }
}

async function safeGet (sel) {
  try {
    createRadio = await page.$(sel)
  } catch (e) {}
}

async function safeGetProperty (sel, prop) {
  try {
    return await page.$eval(sel, el => {
      return el.getProperty(prop).jsonValue()
    })
  } catch (e) {}
}

async function safeEval (sel, fn) {
  try {
    return await page.$eval(sel, fn)
  } catch (e) {}
}

async function getStyle (sel, prop) {
  try {
    return await page.$eval(() => {
      const el = document.querySelector(sel)
      return getComputedStyle(el).getPropertyValue(prop)
    })
  } catch (e) {}
}

function getsrc (el) {
  return el.src
}

function getval (el) {
  return el.value
}

function ischecked (el) {
  return el.checked
}

async function isLoading () {
  var isloading = false
  try {
    isloading = await page.$eval('#loading-div', (el) => getComputedStyle(el).getPropertyValue('display') !== 'none')
  } catch (e) {
    console.error(e)
  }
  return isloading
}

async function assertLoading () {
  var isloading = await isLoading()
  chai.should(isloading).exist
  isloading.should.equal(true)
  return isloading
}

async function assertNotLoading () {
  var isloading = await isLoading()
  chai.assert.isTrue(isloading === false)
  return isloading
}

describe('Setup', () => {
  before(async function () {
    this.timeout(10000)
    // create our own temporary user data dirctory
    userdir = await pify(fs.mkdtemp)(path.join(os.tmpdir(), 'guld-chrome-test'))
    // copy the ledger-native bindings to our temp dir
    const P = `/NativeMessagingHosts/com.guld.ledger.json`
    await pify(mkdirp)(path.dirname(`${userdir}${P}`))
    await pify(fs.copyFile)(`${HOME}/.config/chromium${P}`, `${userdir}${P}`)
    // launch the browser, loading our extension
    // load other extensions to communicate with guld-chrome here
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      ignoreDefaultArgs: true,
      args: args.concat([
        `--user-data-dir=${userdir}`,
        `--load-extension=${path.dirname(__dirname)}`
      ])
    })
    var pages = await browser.pages()
    // get the current (only) page to start manipulating
    page = pages[0]
    var xpage = await browser.newPage()
    await xpage.goto('chrome://extensions')
    // Go to our extension url
    await page.goto(URL, { waitUntil: 'domcontentloaded' })
    await page.bringToFront()
    // set GH values for login boostrap
    await setGH()
  })
  after(async () => {
    // ensure the browser closes neatly
    await browser.close()
  })
  describe('Initialization', () => {
    it('shows loading screen', async () => {
      await assertLoading()
    })
    it('finishes loading in less than 10 mins', async () => {
      var start = Date.now()
      while (await isLoading()) {
        await new Promise(resolve => {
          page.metrics().then(m => {
            console.log(`still loading after ${Number.parseFloat((Date.now() - start) / 60000).toFixed(1)} mins, heap usage ${Math.round(m.JSHeapUsedSize / 1024 / 1024)} Mu of ${Math.round(m.JSHeapTotalSize / 1024 / 1024)} Mu (${Math.round(m.JSHeapUsedSize / m.JSHeapTotalSize * 100)}%)`)
            setTimeout(resolve, 19000)
          })
        })
      }
      await assertNotLoading()
    }).timeout(600000)
  })
  describe('Options', () => {
    it('loads options after', async () => {
      var ghod = await page.$('#gh-options-div')
      while (!(ghod)) {
        ghod = await page.$('#gh-options-div')
        setTimeout(resolve, 100)
      }
      ghod.should.not.equal(undefined)
    })
    it('shows gh avatar (please login if prompted)', async () => {
      while (
        (await safeEval('#ghavatar', getsrc)) === '' ||
        (await safeEval('#ghavatar', (el) => getComputedStyle(el).getPropertyValue('display'))) !== 'inline'
      ) {
        await new Promise(resolve => {
          setTimeout(resolve, 1000)
        })
      }
      var src = (await safeEval('#ghavatar', getsrc)).toString()
      chai.assert.isTrue(src.startsWith('http'))
      chai.assert.equal((await safeEval('#ghavatar', (el) => getComputedStyle(el).getPropertyValue('display'))), 'inline')
    }).timeout(90000)
    it('shows generate by default', async () => {
      while (!(await safeEval('#key-create-radio-generate', ischecked))) {
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      chai.assert.isTrue(await safeEval('#key-create-radio-generate', ischecked))
    })
    it('shows import form when selected', async () => {
      await (await page.$('#key-create-radio-import')).click()
      while (!(await safeEval('#key-create-radio-import', ischecked))) {
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      chai.assert.isTrue(await safeEval('#key-create-radio-import', ischecked))
    })
    it('imports key in < 4 mins', async () => {
      await page.evaluate((a, b) => {
        document.querySelector('#key-import').value = a
        document.querySelector('#guldname-new').value = b
      }, config.privkey, config.username)
      await page.type('#key-passphrase', config.passphrase)
      await (await page.$('#expert-mode')).click()
      await (await page.$('#import-submit')).click()
      while (!(await isLoading())) {
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      await assertLoading()
      while (await isLoading()) {
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      await assertNotLoading()
    }).timeout(240000)
  })
  describe('Dash', () => {
    it('loads dash after', async () => {
      var guldbal = await page.$('#guld-balance')
      while (!(guldbal)) {
        guldbal = await page.$('#guld-balance')
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      guldbal.should.not.equal(undefined)
    }).timeout(120000)
    it('shows guld name', async () => {
      (await safeGetProperty('#guldname', 'innerHTML')).should.equal(config.username)
    })
    it('shows full name', async () => {
      (await safeGetProperty('#fullname', 'innerHTML')).should.equal(config.username)
    })
    it('shows guld balance', async () => {
      chai.assert.isTrue((await safeGetProperty('#guld-balance', 'innerHTML')) !== '')
    })
    it('shows gg balance', async () => {
      chai.assert.isTrue((await safeGetProperty('#gg-balance', 'innerHTML')) !== '')
    })
    it('shows total USD balance', async () => {
      chai.assert.isTrue((await safeGetProperty('#total-usd-value', 'innerHTML')) !== '')
    })
  })
  describe('Send', () => {
    it('goto send', async () => {
      var send = await safeGet('#send')
      while (!send) {
        send = await safeGet('#send')
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      send.click()
      var guldsend
      while (!(guldsend)) {
        guldsend = await page.$('#guld-transfer-form')
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      guldsend.should.not.equal(undefined)
    }).timeout(30000)
    it('send GULD in < 3 mins', async () => {
      var spend = await safeGet('#guld-spend-amount')
      while (!spend) {
        spend = await safeGet('#guld-spend-amount')
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      await page.evaluate((a, b, c) => {
        document.querySelector('#guld-transaction-sender').value = a
        document.querySelector('#guld-transaction-recipient').value = b
        document.querySelector('#guld-spend-amount'.value = c)
      }, config.username, config.recipient, '0.01')
      await (await page.$('#btn-primary')).click()
      var loadingDisp = await page.$eval('#loading-div', (el) => getComputedStyle(el).getPropertyValue('display'))
      while (loadingDisp === 'none') {
        loadingDisp = await page.$eval('#loading-div', (el) => getComputedStyle(el).getPropertyValue('display'))
        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      }
      loadingDisp.should.not.equal('none')
    }).timeout(180000)
  })
})
