# Scription Staking

## Command Line

- install :
  - `npm i`
- create `.env` file in project root path
  - mirror `.env.example`
- compile :
  - `npm run compile`
  - if got `Error HH12`: run command `npm install --save-dev hardhat`
- test :
  - `npm run test`
- coverage :
  - `npm run coverage`
- view methods gas :
  - `npm run gas`
- deploy on hardhat temp network
  - `npm run d`
- deploy on localhost network
  - Terminal 1: `npm run node`
  - Terminal 2: `npm run d:l`
- deploy on blockchain network
  - ✅ Product: `npm run d:fbchain`

All scripts is in `package.json` file.

## Open in remixd web

1. `npm install -g @remix-project/remixd`
2. `npm run remixd`

## console

```js
import 'hardhat/console.sol'
console.log(amount)
```

## test

```js
import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
// import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
```
