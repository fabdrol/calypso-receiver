const axios = require('axios')
const convert = require('xml-js')

async function main () {
  const R = 1
  const endpoint = 'http://192.168.21.107/status.xml'
  const response = await axios.get(`${endpoint}?r${R}=1`)

  console.log('[command]', response.status, response.statusText)
  
  const status = await axios.get(endpoint)
  const result = convert.xml2js(status.data, { compact: true })
  
  console.log(`[status] ${result.Monitor[`Relay${R}`]._text}`)
}

main()