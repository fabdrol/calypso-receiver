const debug = require('debug')('signalk-calypso-receiver/discover')
const Client = require('@signalk/client')
const mdns = require('mdns')
const { Discovery } = Client

const server = {
  found: false,
  client: {},
  send (delta) {
    if (this.found === false) {
      return debug('Not connected to Signal K server')
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
      debug(`PUT request ${path} => ${value}`)
      const request = server.client.request('PUT', {
        put: {
          path,
          value
        }
      })

      request.on('response', response => {
        debug(`[success] PUT ${response.statusCode} ${path} => ${value}`)
        resolve(response)
      })
      
      request.on('error', err => {
        debug(`[failed] PUT ${path} => ${value} (${err.message})`)
        reject(err)
      })

      request.send()
    })
  }
}



module.exports = function discover () {
  const discovery = new Discovery(mdns, 60000)

  discovery.on('timeout', () => {
    debug('No Signal K server found')
    process.exit(1)
  })

  discovery.on('found', server => {
    if (server.isMain() && server.isMaster()) {
      debug(`Signal K server found`)
      server.found = true
      server.client = server.createClient({
        useTLS: false,
        useAuthentication: true,
        reconnect: true,
        autoConnect: true,
        username: 'wind-receiver',
        password: 'wind-receiver',
        notifications: false
      })
    } else {
      debug(`Signal K server found, but it is not a master`)
      process.exit(1)
    }
  })

  return server
}