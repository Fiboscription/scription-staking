let fs = require('fs')
let path = require('path')

//  ABI source
const flag = 'ScriptionStaking'
const jsonFile = require(`../artifacts/contracts/${flag}.sol/${flag}.json`)

const filePath = path.resolve(__dirname, `../abi`)
const utility = {
  start() {
    utility.init()
    utility.writer()
  },
  // mkdir
  init() {
    if (!fs.existsSync(filePath)) {
      console.log('ABI DIR UNDEFINED: MKDIR ...')
      fs.mkdirSync(filePath)
    }
  },
  // set
  writer() {
    console.log('ABI FILE:Read...')
    fs.writeFileSync(path.resolve(filePath, `${flag}.json`), JSON.stringify(jsonFile.abi, null, 2))
    console.log('ABI FILE:Success')
  },
}
utility.start()
