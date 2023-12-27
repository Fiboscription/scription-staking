import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
// import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('StakingTest', function () {
  async function deployOneYearLockFixture() {
    const [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] = await ethers.getSigners()

    const USDT = await ethers.deployContract('MockERC20', ['USDT Token', 'USDT', ethers.parseEther('100000')])
    await USDT.waitForDeployment()

    //deploy
    const scriptionStaking = await ethers.deployContract('ScriptionStaking', [USDT.target, 0])
    await scriptionStaking.waitForDeployment()

    // transfer
    await USDT.transfer(scriptionStaking.target, ethers.parseEther('5000'))
    await USDT.transfer(user1.address, ethers.parseEther('1000'))
    await USDT.transfer(user2.address, ethers.parseEther('1000'))
    await USDT.transfer(user3.address, ethers.parseEther('1000'))
    await USDT.transfer(user4.address, ethers.parseEther('1000'))
    await USDT.transfer(user5.address, ethers.parseEther('1000'))

    user10.sendTransaction({
      to: scriptionStaking.target,
      value: ethers.parseEther('1000'),
    })

    // approve
    await USDT.connect(user1).approve(scriptionStaking.target, ethers.parseEther('1000'))
    await USDT.connect(user2).approve(scriptionStaking.target, ethers.parseEther('1000'))
    await USDT.connect(user3).approve(scriptionStaking.target, ethers.parseEther('1000'))
    await USDT.connect(user4).approve(scriptionStaking.target, ethers.parseEther('1000'))
    await USDT.connect(user5).approve(scriptionStaking.target, ethers.parseEther('1000'))

    return {
      owner,

      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      scriptionStaking,

      USDT,
    }
  }

  it('init data', async function () {
    const { owner, user1, user2, user3, scriptionStaking, USDT } = await loadFixture(deployOneYearLockFixture)

    // address
    expect(await scriptionStaking.stakingToken()).to.equal(USDT.target)
    expect(await scriptionStaking.startBlock()).to.equal('2')

    // data
    expect(await scriptionStaking.totalBlock()).to.equal('681960')
    expect(await scriptionStaking.totalRewards()).to.equal(ethers.parseEther('1000000'))

    // pool
    expect(await scriptionStaking.poolAmount()).to.equal('0')
    expect(await scriptionStaking.poolReward()).to.equal('0')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('2')
    expect(await scriptionStaking.accPerShare()).to.equal('0')

    // user
    expect(await scriptionStaking.userReward(user1.address)).to.equal('0')
  })
  it('User History Bill', async function () {
    const { owner, user1, user2, user3, scriptionStaking, USDT } = await loadFixture(deployOneYearLockFixture)
    // ✅ deposit1
    await scriptionStaking.connect(user1).deposit(10)
    expect(await scriptionStaking.userReward(user1)).to.equal(0)

    await scriptionStaking.connect(user1).deposit(20)
    expect(await scriptionStaking.userReward(user1)).to.equal('1466361663440671007') // 1000000/681960

    await scriptionStaking.connect(user1).withdraw(10)
    expect(await scriptionStaking.userReward(user1)).to.equal('2932723326881342014')
    const userHistoryBill1 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(userHistoryBill1.length).to.equal(3)

    await scriptionStaking.connect(user1).withdraw(1)
    await scriptionStaking.connect(user1).withdraw(3)
    const userHistoryBill3 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(userHistoryBill3.length).to.equal(5)
    expect(await scriptionStaking.userReward(user1)).to.equal('5865446653762684028')

    const info = await scriptionStaking.userInfo(user1)
  })

  it('Deposit/pending', async function () {
    const { owner, user1, user2, user3, scriptionStaking, USDT } = await loadFixture(deployOneYearLockFixture)

    // user
    expect(await scriptionStaking.userReward(user1.address)).to.equal('0')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('2')

    // ✅ deposit1
    await scriptionStaking.connect(user1).deposit(ethers.parseEther('1')) // 15
    // 100000000000

    // pool
    expect(await scriptionStaking.poolAmount()).to.equal(ethers.parseEther('1'))
    expect(await scriptionStaking.poolReward()).to.equal('0')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('15')
    expect(await scriptionStaking.accPerShare()).to.equal('0')
    // user
    const userInfo0 = await scriptionStaking.userInfo(user1.address)
    expect(await userInfo0.singleAmount).to.equal(ethers.parseEther('1'))
    const userHistoryBill0 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(await userHistoryBill0[0].singleAmount).to.equal(ethers.parseEther('1'))
    expect(await scriptionStaking.userReward(user1.address)).to.equal('0')
    expect(await scriptionStaking.pending(user1.address)).to.equal('0')
    expect(await scriptionStaking.accPerShare()).to.equal('0') //

    // ✅ deposit2
    await scriptionStaking.connect(user1).deposit(ethers.parseEther('2')) // 16
    // pool
    expect(await scriptionStaking.poolAmount()).to.equal(ethers.parseEther('3'))
    expect(await scriptionStaking.poolReward()).to.equal('1466361663440671007')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('16') //
    expect(await scriptionStaking.accPerShare()).to.equal('1466361663440671007') //
    // user
    const userInfo1 = await scriptionStaking.userInfo(user1.address)
    expect(await userInfo1.singleAmount).to.equal(ethers.parseEther('2'))
    const userHistoryBill1 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(await userHistoryBill1[0].singleAmount).to.equal(ethers.parseEther('2'))
    expect(await scriptionStaking.userReward(user1.address)).to.equal('1466361663440671007')

    expect(await scriptionStaking.pending(user1.address)).to.equal('0')
    expect(await scriptionStaking.pending(user1.address)).to.equal('0')

    // pool
    expect(await scriptionStaking.poolAmount()).to.equal(ethers.parseEther('3'))
    expect(await scriptionStaking.poolReward()).to.equal('1466361663440671007')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('16')
    expect(await scriptionStaking.accPerShare()).to.equal('1466361663440671007')
    // user
    const userInfo1_1 = await scriptionStaking.userInfo(user1.address)
    expect(await userInfo1_1.singleAmount).to.equal(ethers.parseEther('2'))
    const userHistoryBill1_1 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(await userHistoryBill1_1[0].singleAmount).to.equal(ethers.parseEther('2'))
    expect(await scriptionStaking.userReward(user1.address)).to.equal('1466361663440671007')
    expect(await scriptionStaking.pending(user1.address)).to.equal(ethers.parseEther('0'))

    // ✅ withdraw1
    await scriptionStaking.connect(user1).withdraw(ethers.parseEther('1')) // 17

    // pool
    expect(await scriptionStaking.poolAmount()).to.equal(ethers.parseEther('2'))
    expect(await scriptionStaking.poolReward()).to.equal('2932723326881342012') // 3 block
    expect(await scriptionStaking.lastRewardBlock()).to.equal('17')
    expect(await scriptionStaking.accPerShare()).to.equal('1955148884587561342') // +=
    // user
    const userInfo2 = await scriptionStaking.userInfo(user1.address)
    expect(await userInfo2.singleAmount).to.equal(ethers.parseEther('1'))
    const userHistoryBill2 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)

    expect(await userHistoryBill2[0].isDeposit).to.equal(false)
    expect(await userHistoryBill2[0].singleAmount).to.equal(ethers.parseEther('1'))
    expect(await userHistoryBill2[0].rewardDebt).to.equal('3910297769175122684')
    expect(await userHistoryBill2[0].currentReward).to.equal('1466361663440671005')
    expect(await scriptionStaking.userReward(user1.address)).to.equal('2932723326881342012')
    expect(await scriptionStaking.pending(user1.address)).to.equal('0')

    // ✅ withdraw2
    await scriptionStaking.connect(user1).withdraw(ethers.parseEther('1')) // 19
    // pool
    expect(await scriptionStaking.poolAmount()).to.equal(ethers.parseEther('1'))
    expect(await scriptionStaking.poolReward()).to.equal('4399084990322013018') // 144 + 288 = 432
    expect(await scriptionStaking.lastRewardBlock()).to.equal('18')
    expect(await scriptionStaking.accPerShare()).to.equal('2688329716307896845') //
    // user
    const userInfo3 = await scriptionStaking.userInfo(user1.address)

    expect(await userInfo3.singleAmount).to.equal(ethers.parseEther('1'))
    expect(await userInfo3.rewardDebt).to.equal('2688329716307896845')
    const userHistoryBill3 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(await userHistoryBill3[0].isDeposit).to.equal(false)
    expect(await userHistoryBill3[0].singleAmount).to.equal(ethers.parseEther('1'))
    expect(await userHistoryBill3[0].rewardDebt).to.equal('2688329716307896845')
    expect(await userHistoryBill3[0].currentReward).to.equal('1466361663440671006')
    expect(await scriptionStaking.userReward(user1.address)).to.equal('4399084990322013018')
    expect(await scriptionStaking.pending(user1.address)).to.equal('0')
    expect(await scriptionStaking.pending(user1.address)).to.equal('0') // zero
  })

  it('Deposit 2user', async function () {
    const { owner, user1, user2, user3, scriptionStaking, USDT } = await loadFixture(deployOneYearLockFixture)

    // user
    expect(await scriptionStaking.userReward(user1.address)).to.equal('0')
    expect(await scriptionStaking.startBlock()).to.equal('2')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('2')

    // ✅ deposit1
    await scriptionStaking.connect(user1).deposit(ethers.parseEther('1')) // 15
    expect(await scriptionStaking.startBlock()).to.equal('2')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('15') // first
    await scriptionStaking.connect(user2).deposit(ethers.parseEther('1')) // 16
    expect(await scriptionStaking.poolAmount()).to.equal(ethers.parseEther('2'))
    expect(await scriptionStaking.poolReward()).to.equal('0')
    expect(await scriptionStaking.lastRewardBlock()).to.equal('16') //
    expect(await scriptionStaking.accPerShare()).to.equal('1466361663440671007') //

    // ==> user1
    const userInfo1 = await scriptionStaking.userInfo(user1.address)
    expect(await userInfo1.singleAmount).to.equal(ethers.parseEther('1'))
    const userHistoryBill1 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(await userHistoryBill1[0].singleAmount).to.equal(ethers.parseEther('1'))
    expect(await scriptionStaking.userReward(user1.address)).to.equal('0')

    // ==> user2
    const userInfo02 = await scriptionStaking.userInfo(user2.address)
    expect(await userInfo02.singleAmount).to.equal(ethers.parseEther('1'))
    const userHistoryBill02 = await scriptionStaking.getUserHistoryBill(user2.address, '1000000000000000000', 100)
    expect(await userHistoryBill02[0].singleAmount).to.equal(ethers.parseEther('1'))
    expect(await scriptionStaking.userReward(user2.address)).to.equal('0')

    // pending
    expect(await scriptionStaking.pending(user1.address)).to.equal('1466361663440671007')
    expect(await scriptionStaking.pending(user2.address)).to.equal('0')

    // ✅ withdraw1
    await scriptionStaking.connect(user1).withdraw(ethers.parseEther('0.5')) // 17
    await scriptionStaking.connect(user2).withdraw(ethers.parseEther('0.5')) // 18

    // ==> user1
    const userInfo2 = await scriptionStaking.userInfo(user1.address)
    expect(await userInfo2.singleAmount).to.equal(ethers.parseEther('0.5'))
    const userHistoryBill2 = await scriptionStaking.getUserHistoryBill(user1.address, '1000000000000000000', 100)
    expect(await userHistoryBill2[0].singleAmount).to.equal(ethers.parseEther('0.5'))
    // 1
    // 1.5
    expect(await scriptionStaking.userReward(user1.address)).to.equal('2199542495161006510')

    // ==> user2
    const userInfo03 = await scriptionStaking.userInfo(user2.address)
    expect(await userInfo03.singleAmount).to.equal(ethers.parseEther('0.5'))
    const userHistoryBill03 = await scriptionStaking.getUserHistoryBill(user2.address, '1000000000000000000', 100)
    expect(await userHistoryBill03[0].singleAmount).to.equal(ethers.parseEther('0.5'))
    // 1710755274014116174
    expect(await scriptionStaking.userReward(user2.address)).to.equal('1710755274014116174')

    // pending
    expect(await scriptionStaking.pending(user1.address)).to.equal('488787221146890335')
    expect(await scriptionStaking.pending(user2.address)).to.equal('0')

    await time.advanceBlockTo(20) //
    expect(await scriptionStaking.pending(user1.address)).to.equal('1955148884587561342')
    expect(await scriptionStaking.pending(user2.address)).to.equal('1466361663440671007')

    await time.advanceBlockTo(681960) //
    expect(await scriptionStaking.pending(user1.address)).to.equal('499987291532250180851271')
    expect(await scriptionStaking.pending(user2.address)).to.equal('499986802745029033960936')

    await time.advanceBlockTo(681962) //
    expect(await scriptionStaking.pending(user1.address)).to.equal('499988757893913621522278')
    expect(await scriptionStaking.pending(user2.address)).to.equal('499988269106692474631943')

    await time.advanceBlockTo(681963) //
    expect(await scriptionStaking.pending(user1.address)).to.equal('499988757893913621522278')
    expect(await scriptionStaking.pending(user2.address)).to.equal('499988269106692474631943')

    await time.advanceBlockTo(11681963) //
    expect(await scriptionStaking.pending(user1.address)).to.equal('499988757893913621522278')
    expect(await scriptionStaking.pending(user2.address)).to.equal('499988269106692474631943')
  })
})
