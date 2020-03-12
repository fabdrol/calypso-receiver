const { Ultrasonic } = require('signalk-calypso-ultrasonic')()
const debug = require('debug')('signalk-calypso-receiver')
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
    const items = await server.send(server.client, delta)

    if (items && Array.isArray(items)) {
      debug(`PUT ${items.length} paths`)
    }
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
  console.error(`[uncaughtException] ${err.message}`)
  console.log(err.stack)
  cleanup()
  process.exit(1)
})
