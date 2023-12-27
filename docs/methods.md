# Contract Methods Des

## read-only function

- `stakingToken()`: scription address
- about reward
  - `getPerBlock()`: get pre reward
  - `accPerShare()`: total reward by 1 wei
  - `startBlock()`: staking start block
  - `totalBlock()`: staking total block
  - `totalRewards()`: staking total reward
- pool
  - `poolAmount()`: staking pool amount
  - `poolReward()`: rewards issued
  - `lastRewardBlock()`: latest reward block
  - `available()`: current quantity
- user

  - `userInfo(user_address)`: get user staking info
  - `userReward(user_address)`:get rewards issued for user
  - `pending(user_address)` user pending reward
  - `getUserHistoryBill(user_address, start_id, limit)` get bill list for user

    - user index is `id`
    - inverse list: first get `getUserHistoryBill(user1.address, '1000000000000000000', 100)`
    - returns

      ```
      id                  : "0",            bill id
      isDeposit           : true,           true is deposit
      timestamp           : "1676371395",   bill time

      singleAmount        : "10",           current active amount
      amount              : "10",           the amount after active
      currentReward       : "0",            current reward
      rewardDebt          : "0",            current reward debt
      ```

- `updatePool()`: update Pool
- `userHistoryBill(user,id)`: get user bill id info.

## main function

**main**:

- `deposit(_amount)`: user deposit
- `withdraw(_amount)`: user withdraw
