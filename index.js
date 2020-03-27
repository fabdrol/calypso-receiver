const { Ultrasonic } = require('signalk-calypso-ultrasonic')()
const debug = require('debug')('signalk-calypso-receiver')
// const discover = require('./lib/discover')

const ultrasonic = new Ultrasonic({
  setRate: 1, // Hz
  setCompass: 1, // Turn on compass/9DOF sensor
  maxRetries: Infinity,
  sleep: false
})

// const server = discover()

// Set-up & start searching
ultrasonic.on('delta', delta => handleDeltaMessage(delta))
ultrasonic.start()

async function handleDeltaMessage (delta) {
  try {
    debug(`[data ${Date.now()}] ${JSON.stringify(delta)}`)
    // await server.send(delta)
  } catch (err) {
    console.error(`[exception sending delta] ${err.message}`)
    cleanup()
  }
}

function cleanup (exit = true) {
  // Stop searching, disconnect & clean-up
  debug(`[cleanup]`)
  ultrasonic.stop()
  ultrasonic.disconnect()
  ultrasonic.removeAllListeners()

  if (exit === true) {
    process.exit()
  }
}

process.on('beforeExit', () => {
  if (ultrasonic) {
    cleanup(false)
  }
})

process.on('uncaughtException', (err) => {
  console.error(`[uncaught exception] ${err.message}`)
  console.log(err.stack)
  cleanup()
})
