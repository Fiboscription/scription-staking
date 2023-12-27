import hre from 'hardhat'
import { ethers } from 'hardhat'

console.log('hre.network.name', hre.network.name)

// ************ Settings ************
const Token = {
  // for other chain test
  okchain: {
    scription: '0xff8B62ab02B7eEF19E09e1Dfafb6688F1Af84a03',
    startBlock: 0,
  },
  // for fibo chain
  fbchain: {
    scription: '0x23FC4FebeF366a28134C71C66cFE9F5a64b47e2E',
    startBlock: '17896611', //  17510167 + 22732 * 17 => 2023-12-26 20:00:01 + 17 day
  },
}

const CONF = Token[hre.network.name]

// ************ Settings ************

// current network info
console.log('\n ============ BASIC  INFO ============')
console.log('✅ Current Network   :', hre.network.name)
console.log('   Network Url       :', hre.network.config.url || 'hardhat temp network')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('✅ Deployer Address  :', deployer.address)
  const usdt = await ethers.getContractAt('MockERC20', CONF.scription)
  const startBlock = 17896611

  console.log('\n ____________ Deployed address ____________')
  console.log('Scription Address  :', CONF.scription)
  console.log('\n ____________ DEPLOY INFO ____________')

  //deploy
  const ScriptionStaking = await ethers.deployContract('ScriptionStaking', [CONF.scription, CONF.startBlock], { gasLimit: '0x1000000' })
  await ScriptionStaking.waitForDeployment()
  console.log(`ScriptionStaking              : ${ScriptionStaking.target}`)

  // End
  console.log('\n ============ DEPLOY  END ============')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
