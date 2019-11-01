const { Ultrasonic } = require('signalk-calypso-ultrasonic')()
const debug = require('debug')('calypso-receiver')

const ultrasonic = new Ultrasonic({
  setRate: 1, // Hz
  setCompass: 0, // Turn on compass/9DOF sensor
  maxRetries: Infinity,
  sleep: false
})

// Set-up & start searching
ultrasonic.on('delta', delta => handleDeltaMessage(delta))
ultrasonic.start()

function handleDeltaMessage (delta) {
  debug(`[delta] ${JSON.stringify(delta, null, 2)}`)
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
  console.error(`[exception] ${err.message}`);
  process.exit()
})