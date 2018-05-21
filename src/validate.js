module.exports.validatePass = () => {
  var errmess = 'Password invalid or does not match. '
  // TODO get these elements
  var same = (passin.value === passrin.value)
  if (same !== true) setError(errmess)
  else unsetError(errmess)
  return same
}

module.exports.validateSender = () => {
  window.senderDiv = window.senderDiv || document.getElementById('guld-transaction-sender')
  var errmess = 'Unknown sender. '
  return getBackground().then((b) => {
    return b.blocktree.isNameAvail(window.senderDiv.value).then(avail => {
      if (avail !== false) {
        setError(errmess)
      } else {
        unsetError(errmess)
      }
      return (avail === false)
    }).catch(e => {
      setError(errmess)
      return false
    })
  })
}

module.exports.validateRecipient = () => {
  window.recDiv = window.recDiv || document.getElementById('guld-transaction-recipient')
  var errmess = 'Unknown recipient. '
  return getBackground().then((b) => {
    return b.blocktree.isNameAvail(window.recDiv.value).then(avail => {
      if (avail !== false) {
        setError(errmes)
      } else {
        unsetError(errmess)
      }
      return (avail === false)
    }).catch(e => {
      setError(errmess)
      return false
    })
  })
}

module.exports.validateSpendAmount = () => {
  amtDiv = amtDiv || document.getElementById('guld-spend-amount')
  amount = new Decimal(amtDiv.value)
  var errmess = 'Invalid amount. '
  if (amount.greaterThan(window.balance.toString())) {
    setError(errmess)
    return false
  } else {
    unsetError(errmess)
    return true
  }
}

module.exports.checkGName = () => {
  return b.blocktree.isNameAvail(guldnameDiv.value).then(avail => {
    if (avail && errdiv.innerHTML.indexOf(NAMEWARN) > -1) unsetError(NAMEWARN)
    else if (errdiv.innerHTML.indexOf(NAMEWARN) === -1 && b.keyring.privateKeys.keys.length === 0) setError(NAMEWARN)
    return avail
  }).catch(() => {
    setError(NAMEWARN)
    return false
  })
}

