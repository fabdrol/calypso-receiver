const debug = require('debug')('calypso-receiver/discover')
const bonjour = require('bonjour')()
const axios = require('axios')
const uuid = require('uuid').v4

const server = {
  found: false,
  server: {},
  send (delta) {
    if (this.found === false) {
      return
    }

    if (!delta || typeof delta !== 'object' || !Array.isArray(delta.updates)) {
      return
    }

    const correlationId = uuid()
    const promises = []
    
    delta.updates.forEach(update => {
      if (!update || typeof update !== 'update' || !Array.isArray(update.values)) {
        return
      }

      update.values.forEach(mutation => {
        promises.push(server.putDelta(correlationId, mutation.path, mutation.value))
      })
    })

    if (Array.isArray(promises) && promises.length > 0) {
      return Promise.all(promises)
    }

    return Promise.reject(new Error('No deltas to put'))
  },

  putDelta (correlationId, path, value) {
    const source = 'Calypso_Ultrasonic'
    const body = {
      correlationId,
      context: 'vessels.self',
      put: {
        path,
        value,
        source
      }
    }

    const { host, port } = this.server
    let endpoint = ''

    if (typeof host === 'string') {
      endpoint += 'http://'
      endpoint += host
    }

    if (typeof port === 'number' && port > 0 && !isNaN(port)) {
      endpoint += ':'
      endpoint += String(port)
    }

    debug(`[sending] ${endpoint} ${JSON.stringify(delta)}`)
    return axios.put(endpoint, body)
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