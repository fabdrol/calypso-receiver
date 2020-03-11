const debug = require('debug')('calypso-receiver/discover')
const Client = require('@signalk/client')
const mdns = require('mdns')
const { Discovery } = Client

const server = {
  found: false,
  client: {},
  send (delta) {
    if (this.found === false) {
      return
    }

    if (!delta || typeof delta !== 'object' || !Array.isArray(delta.updates)) {
      return
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
      return Promise.all(promises)
    }

    debug(`No deltas to PUT`)
    return Promise.resolve([])
  },

  putDelta (path, value) {
    return new Promise((resolve, reject) => {
      const request = server.client.request('PUT', {
        put: {
          path,
          value
        }
      })

      request.once('response', response => {
        debug(`[success] PUT ${response.statusCode} ${path} => ${value}`)
        resolve(response)
      })
      
      request.once('error', err => {
        debug(`[failed] PUT ${path} => ${value} (${err.message})`)
        reject(err)
      })

      request.send()
    })
  }
}



module.exports = function discover () {
  const discover = new Discovery(mdns, 60000)

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
        password: 'wind-receiver'
      })
    } else {
      debug(`Signal K server found, but it is not a master`)
      process.exit(1)
    }
  })

  return server
}