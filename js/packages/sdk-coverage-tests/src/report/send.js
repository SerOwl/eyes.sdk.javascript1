const fetch = require('node-fetch')

async function _send({uri, payload}) {
  console.log(payload.results.length)
  console.log(payload.results.filter(t => t.isSkipped).length)
  const result = await fetch(uri, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'},
  })
  return {isSuccessful: result.status === 200, message: result.statusText}
}

async function sendReport(payload) {
  return _send({uri: 'http://applitools-quality-server.herokuapp.com/result', payload})
}

async function sendNotification(payload) {
  return _send({uri: 'http://applitools-quality-server.herokuapp.com/send_mail/sdks', payload})
}

module.exports = {sendReport, sendNotification}
