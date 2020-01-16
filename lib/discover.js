const debug = require('debug')('calypso-receiver/discover')
const bonjour = require('bonjour')()
const axios = require('axios')

const server = {
  found: false,
  server: {},
  send (delta) {
    if (this.found === false) {
      return
    }

    debug(JSON.stringify(this.server, null, 2))
    // debug(`Sending delta: ${JSON.stringify(delta)}`)
    // axios.put(``)
  }
}

module.exports = function discover () {
  const query = {
    type: 'signalk-http'
  }

  const browser = bonjour.findOne(query, (host) => {
    debug(`Found host: ${JSON.stringify(host, null, 2)}`)
    server.server = host
    server.found = true
  })

  return server
}