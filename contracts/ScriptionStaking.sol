// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IScription {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Contract for Staking
contract ScriptionStaking {
    /* ============ Struct ============ */
    struct UserInfo {
        uint256 id;
        uint256 timestamp;
        bool isDeposit;
        uint256 amount;
        uint256 rewardDebt;
        uint256 singleAmount;
        uint256 currentReward;
    }

    /* ============ State Variables ============ */
    address public immutable stakingToken;
    uint256 public immutable startBlock;
    uint256 public totalBlock = 22732 * 30;
    uint256 public totalRewards = 100_0000 * 1e18;

    // ************ pool ************
    uint256 public poolAmount;
    uint256 public poolReward;
    uint256 public lastRewardBlock;
    uint256 public accPerShare;

    // ************ user ************
    mapping(address => UserInfo) public userInfo;
    mapping(address => UserInfo[]) public userHistoryBill;
    mapping(address => uint256) public userReward;

    // ************ other ************
    uint256 internal constant BASE_MUL = 1e18;

    /* ============ Events ============ */
    event Deposit(address indexed user, uint256 bid, uint256 amount);
    event Withdraw(address indexed user, uint256 bid, uint256 amount);
    event HistoryBill(address indexed user, uint256 bid);

    /* ============ Constructor ============ */
    constructor(address _stakingAddress, uint256 _startBlock) {
        stakingToken = _stakingAddress;
        startBlock = block.number > _startBlock ? block.number : _startBlock;
        lastRewardBlock = block.number;
    }

    /* ============ Main Functions ============ */
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        if (poolAmount == 0 || block.number < startBlock) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 currentTargetBlock = block.number > (startBlock + totalBlock) ? (startBlock + totalBlock) : block.number;
        uint256 currentBlockNum = _getBlockDiff(lastRewardBlock, currentTargetBlock);
        if (currentBlockNum == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 perBlock = getPerBlock();

        accPerShare += ((currentBlockNum * perBlock) / poolAmount);
        lastRewardBlock = block.number;
    }

    function deposit(uint256 _amount) public {
        require(_amount > 0, 'Deposit: amount must be greater than zero');

        // uodate pool
        updatePool();

        // dis old reward
        UserInfo storage user = userInfo[msg.sender];
        if (user.amount > 0) {
            uint256 pendingReward = ((user.amount * accPerShare) / BASE_MUL) - (user.rewardDebt);
            payable(msg.sender).transfer(pendingReward);
            user.currentReward = pendingReward;
            userReward[msg.sender] += pendingReward;
            poolReward += pendingReward;
        }

        // new bill
        user.id = userHistoryBill[msg.sender].length;
        user.timestamp = block.timestamp;
        user.isDeposit = true;
        user.singleAmount = _amount;

        // amount rewardDebt singleAmount currentReward
        if (_amount > 0) {
            uint256 balBefore = available();
            IScription(stakingToken).transferFrom(address(msg.sender), address(this), _amount);
            uint256 balAfter = available();
            require((balAfter - balBefore) == _amount, 'Deposit: error');
        }

        // user : amount
        user.amount += _amount;
        poolAmount += _amount;

        // rewardDebt
        user.rewardDebt = (user.amount * accPerShare) / BASE_MUL;

        _pushUserHistory(msg.sender, user.id);
        emit Deposit(msg.sender, user.id, _amount);
    }

    function withdraw(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, 'Withdraw: insufficient balance');

        // uodate pool
        updatePool();

        // dis old reward
        if (user.amount > 0) {
            uint256 pendingReward = ((user.amount * accPerShare) / BASE_MUL) - (user.rewardDebt);
            payable(msg.sender).transfer(pendingReward);
            user.currentReward = pendingReward;
            userReward[msg.sender] += pendingReward;
            poolReward += pendingReward;
        }

        // new bill
        user.id = userHistoryBill[msg.sender].length;
        user.timestamp = block.timestamp;
        user.isDeposit = false;
        user.singleAmount = _amount;

        // Amount
        if (_amount > 0) {
            user.amount -= _amount;
            poolAmount -= _amount;
            IScription(stakingToken).transfer(address(msg.sender), _amount);
        }

        user.rewardDebt = (user.amount * accPerShare) / BASE_MUL;

        _pushUserHistory(msg.sender, user.id);
        emit Withdraw(msg.sender, user.id, _amount);
    }

    /* ============ Internal Functions ============ */
    function _getBlockDiff(uint256 _from, uint256 _to) internal pure returns (uint256) {
        if (_to <= _from) {
            return 0;
        } else {
            return _to - _from;
        }
    }

    // history
    function _pushUserHistory(address user_address, uint256 _bid) private {
        UserInfo storage user = userInfo[user_address];
        userHistoryBill[msg.sender].push(user);
        emit HistoryBill(msg.sender, _bid);
    }

    /* ============ Helper Functions ============ */
    function getPerBlock() public view returns (uint256 perBlock) {
        perBlock = (totalRewards * BASE_MUL) / totalBlock;
    }

    // frontend:Get the user's bill list, in reverse order
    function getUserHistoryBill(address _user_address, uint256 _start_id, uint256 _limit) public view returns (UserInfo[] memory) {
        UserInfo[] storage billList = userHistoryBill[_user_address];
        uint256 length = billList.length;
        if (length == 0) {
            return new UserInfo[](0);
        }

        // If _start_id is large
        if (_start_id >= length) {
            _start_id = length - 1;
        }

        // If start ID is less than limit: correct limit
        if ((_start_id + 1) < _limit) {
            _limit = _start_id + 1;
        }

        uint256 startIndex = _start_id; // Include
        uint256 endIndex = _start_id + 1 - _limit; // Include
        UserInfo[] memory result = new UserInfo[](_limit);
        for (uint256 i = startIndex; i >= endIndex; --i) {
            result[startIndex - i] = billList[i];
            if (i == 0) {
                break;
            }
        }
        return result;
    }

    // frontend:View pending rewards
    function pending(address _user) external view returns (uint256 pendingReward) {
        UserInfo storage user = userInfo[_user];
        uint256 tempAccPS = accPerShare;
        if (poolAmount != 0 && block.number > startBlock) {
            uint256 currentTargetBlock = block.number > (startBlock + totalBlock) ? (startBlock + totalBlock) : block.number;
            uint256 currentBlockNum = _getBlockDiff(lastRewardBlock, currentTargetBlock);
            if (currentBlockNum > 0) {
                uint256 perBlock = getPerBlock();
                tempAccPS += ((currentBlockNum * perBlock) / poolAmount);
            }
        }
        pendingReward = ((user.amount * tempAccPS) / BASE_MUL) - user.rewardDebt;
    }

    function available() public view returns (uint256) {
        return IScription(stakingToken).balanceOf(address(this));
    }

    receive() external payable {}
}
