const puppeteer = require('puppeteer')
const chai = require('chai')

const URL = 'chrome-extension://fggohbjlmjldccoelobkepngbkkebefi/html/main.html?view=options'
const args = puppeteer.defaultArgs().filter(arg => String(arg).toLowerCase() !== '--disable-extensions');

var browser

describe('Setup', () => {
  before(async () => {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      ignoreDefaultArgs: true,
      args: args.concat('--load-extension=/BLOCKTREE/ira/tech/js/node_modules/guld-chrome')
    });
    var pages = await browser.pages()
    this.page = pages[0]
  })
  after(async () => {
    await browser.close()
  });
  it('shows loading screen', async () => {
    await this.page.goto(URL, { waitUntil: ['domcontentloaded'] })
    var loadingDisp = await this.page.$eval('#loading-div', (el) => getComputedStyle(el).getPropertyValue('display'))
    chai.should(loadingDisp).exist
    loadingDisp.should.equal('block')
  })
})

