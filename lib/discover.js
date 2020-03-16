const debug = require('debug')('signalk-calypso-receiver/discover')
const Client = require('@signalk/client')
const Bonjour = require('bonjour')
const { Discovery } = Client

let client = null
let ready = false

const server = {
  client,
  ready,
  send (delta) {
    if (!client || ready === false) {
      return
    }

    return new Promise((resolve, reject) => {
      if (!delta || typeof delta !== 'object' || !Array.isArray(delta.updates)) {
        debug('Delta is malformed')
        return reject(new Error('Delta is malformed'))
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Promise not resolved after 10000 ms`))
      }, 10000)

      client
        .connection
        .send(delta)
        .then(result => {
          if (timeout) {
            clearTimeout(timeout)
          }

          debug(`Sent delta; result: ${result}`)
          resolve(delta)
        })
        .catch(err => {
          if (timeout) {
            clearTimeout(timeout)
          }

          debug(`Error sending delta: ${err.message}`)
          reject(err)
        })
    })
  }
}

module.exports = function discover () {
  const bonjour = Bonjour()
  const discovery = new Discovery(bonjour, 30000)
  const username = 'xmiles@decipher.industries'
  const password = 'xmiles2020'

  discovery.on('timeout', () => {
    debug('No Signal K server found')
    process.exit(1)
  })

  discovery.on('found', server => {
    debug(`Found SK server: ${JSON.stringify(server, null, 2)}`)

    if (!server.isMain() || !server.isMaster()) {
      debug(`Signal K server found, but it is not a master`)
      return process.exit(1)
    }

    debug(`Signal K server found: ${JSON.stringify(server, null, 2)}`)

    client = server.createClient({
      useTLS: false,
      reconnect: true,
      autoConnect: false,
      notifications: false,
      useAuthentication: false,
      bearerTokenPrefix: 'JWT'
    })

    client.on('connect', () => {
      debug(`Connected to Signal K server, authenticating`)
      client.authenticate(username, password)
    })
  
    client.once('authenticated', () => {
      debug(`Authenticated with Signal K server`)
      ready = true
    })
  
    client.connect()
  })

  return server
}
