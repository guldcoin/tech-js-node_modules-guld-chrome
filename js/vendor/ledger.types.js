/**
 * @module ledger-types
 * @license MIT
 * @author zimmi
 */


if (typeof require !== 'undefined') {
  var Decimal = require('decimal.js')
} // Otherwise assume Decimal was imported from decimal.js.

class Amount {
  constructor (amount, commodity) {
    this.value = new Decimal(amount)
    this.commodity = commodity || ''
  }

  hasSameCommodity(amount) {
    if (!amount.hasOwnProperty('commodity') || this.commodity != amount.commodity) {
      throw new TypeError(`add error: ${this.commodity} does not match ${amount}`)
      return false
    } else return true
  }

  add (amount) {
    if (this.hasSameCommodity(amount)) return new Amount(this.value.add(amount.value), this.commodity)
  }

  sub (amount) {
    if (this.hasSameCommodity(amount)) return new Amount(this.value.sub(amount.value), this.commodity)
  }

  mul (amount) {
    if (this.hasSameCommodity(amount)) return new Amount(this.value.mul(amount.value), this.commodity)
  }

  div (amount) {
    if (this.hasSameCommodity(amount)) return new Amount(this.value.div(amount.value), this.commodity)
  }

  equals (amount) {
    try {
      this.hasSameCommodity(amount)
      return this.value.equals(amount.value)
    } catch(e) {
      return false
    }
  }
}

class Balance {
  constructor (amounts) {
    if (amounts instanceof Amount) this[amounts.commodity] = amounts
    else Object.assign(this, amounts)
  }

  addAmount (amount) {
    var newBal = new Balance(this)
    if (this.hasOwnProperty(amount.commodity)) newBal[amount.commodity] = newBal[amount.commodity].add(amount)
    else newBal[amount.commodity] = amount
    return newBal
  }

  add (bal) {
    if (bal instanceof Amount) return this.addAmount(bal)
    else {
      var newBal = new Balance(this)
      Object.keys(bal).forEach(commodity => {
        newBal = newBal.addAmount(bal[commodity])
      })
      return newBal
    }
  }

  subAmount (amount) {
    var newBal = new Balance(this)
    if (this.hasOwnProperty(amount.commodity)) newBal[amount.commodity] = newBal[amount.commodity].sub(amount)
    else newBal[amount.commodity] = amount.mul(new Amount(-1, amount.commodity))
    return newBal
  }

  sub (bal) {
    if (bal instanceof Amount) return this.subAmount(bal)
    else {
      var newBal = new Balance(this)
      Object.keys(bal).forEach(commodity => {
        newBal = newBal.subAmount(bal[commodity])
      })
      return newBal
    }
  }

  mulAmount (amount) {
    var newBal = new Balance(this)
    if (this.hasOwnProperty(amount.commodity)) newBal[amount.commodity] = newBal[amount.commodity].mul(amount)
    return newBal
  }

  mul (bal) {
    if (bal instanceof Amount) return this.mulAmount(bal)
    else throw new TypeError('Balances can only be multiplied by Amounts')
  }

  divAmount (amount) {
    var newBal = new Balance(this)
    if (this.hasOwnProperty(amount.commodity)) newBal[amount.commodity] = newBal[amount.commodity].div(amount)
    return newBal
  }

  div (bal) {
    if (bal instanceof Amount) return this.divAmount(bal)
    else throw new TypeError('Balances can only be divided by Amounts')
  }

  equals (bal) {
    var mykeys = Object.keys(this)
    if (mykeys.length != Object.keys(bal).length) return false
    else {
      var allEqual = true
      mykeys.forEach(key => {
        if (!bal.hasOwnProperty(key) || !this[key].equals(bal[key])) allEqual = false
      })
      return allEqual
    }
  }

  commodities () {
    return Object.keys(this).filter(key => {
      return !key.startsWith('_')
    })
  }
}

class Account {
  constructor (bal) {
    this.__bal = bal || new Balance({})
  }

  _add (bal, path) {
    var parent = this
    var done = []
    while (path.length > 0) {
      done.push(path.shift())
      if (path.length > 0) {
        if (!parent.hasOwnProperty(done[done.length - 1])) {
          parent[done[done.length - 1]] = new Account()
        }
      } else {
        if (parent.hasOwnProperty(done[done.length - 1])) {
          parent[done[done.length - 1]].__bal = parent[done[done.length - 1]].__bal.add(bal)
        } else {
          parent[done[done.length - 1]] = new Account(bal)
        }
      }
      parent = parent[done[done.length - 1]]
    }
  }

  _bal () {
    if (this.hasOwnProperty('__bal') && !this.__bal.equals(new Balance({}))) {
      return this.__bal
    } else {
      var chkeys = Object.keys(this)
      this.__bal = new Balance({})
      if (chkeys.length > 0) {
        chkeys.forEach(child => {
          if (!child.startsWith('_')) this.__bal = this.__bal.add(this[child]._bal())
        })
      }
      return this.__bal
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = {Amount: Amount, Balance: Balance, Account: Account}
} // Otherwise assume Decimal was imported from decimal.js.
