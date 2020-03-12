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

    if (!delta || typeof delta !== 'object' || !Array.isArray(delta.updates)) {
      return debug('Delta is malformed')
    }

    const promises = []
    
    delta.updates.forEach(update => {
      if (!update || typeof update !== 'object' || !Array.isArray(update.values)) {
        return
      }

      update.values.forEach(mutation => {
        promises.push(this.putDelta(mutation.path, mutation.value))
      })
    })

    if (Array.isArray(promises) && promises.length > 0) {
      debug(`PUTting ${promises.length} values`)
      return Promise.all(promises)
    }

    debug(`No deltas to PUT`)
    return Promise.resolve([])
  },

  putDelta (path, value) {
    return new Promise((resolve, reject) => {
      debug(`[pending] PUT ${path} => ${value}`)
      const request = client.request('PUT', {
        put: {
          path,
          value
        }
      })

      request.on('response', response => {
        if (response.statusCode !== 200) {
          debug(`[failed] PUT ${response.statusCode} ${response.statusText || response.data || ''}`)
          return reject(new Error(`PUT ${response.statusCode} ${response.statusText}`))
        }
        
        resolve(response)
      })
      
      request.on('error', err => {
        debug(`[failed] PUT ${err.message}`)
        reject(err)
      })

      request.send()
    })
  }
}



module.exports = function discover () {
  const bonjour = Bonjour()
  const discovery = new Discovery(bonjour, 30000)

  discovery.on('timeout', () => {
    debug('No Signal K server found')
    process.exit(1)
  })

  discovery.on('found', server => {
    debug(`Found SK server: ${JSON.stringify(server, null, 2)}`)

    if (server.isMain() && server.isMaster()) {
      debug(`Signal K server found`)
      
      client = server.createClient({
        useTLS: false,
        useAuthentication: true,
        reconnect: true,
        autoConnect: false,
        username: 'wind-receiver',
        password: 'wind-receiver',
        notifications: false
      })

      client.on('connect', () => {
        debug(`Connected to Signal K server`)
        ready = true
      })

      client.connect()
    } else {
      debug(`Signal K server found, but it is not a master`)
      process.exit(1)
    }
  })

  return server
}