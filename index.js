const { Ultrasonic } = require('signalk-calypso-ultrasonic')()
const debug = require('debug')('calypso-receiver')
const discover = require('./lib/discover')

const ultrasonic = new Ultrasonic({
  setRate: 1, // Hz
  setCompass: 1, // Turn on compass/9DOF sensor
  maxRetries: Infinity,
  sleep: false
})

const server = discover()

// Set-up & start searching
ultrasonic.on('delta', delta => handleDeltaMessage(delta))
ultrasonic.start()

async function handleDeltaMessage (delta) {
  try {
    const items = await server.send(delta)
    debug(`PUT ${Array.isArray(items) ? items.length : ''} paths ${!Array.isArray(items) ? JSON.stringify(items, null, 2) : ''}`)
  } catch (err) {
    console.error(`[exception] ${err.message}`)
    cleanup()
    process.exit(1)
  }
}

function cleanup () {
  // Stop searching, disconnect & clean-up
  debug(`[cleanup]`)
  ultrasonic.stop()
  ultrasonic.disconnect()
  ultrasonic.removeAllListeners()
}

process.on('beforeExit', () => {
  if (ultrasonic) {
    cleanup()
  }
})

process.on('uncaughtException', (err) => {
  console.error(`[exception] ${err.message}`)
  cleanup()
  process.exit(1)
})