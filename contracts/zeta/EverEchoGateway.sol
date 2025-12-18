// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";

/**
 * @title EverEchoGateway
 * @dev 跨链奖励网关合约，用于管理任务奖励的存储和领取
 * 
 * 核心功能：
 * 1. 存储任务奖励资金
 * 2. 管理奖励状态
 * 3. 处理奖励领取
 */
contract EverEchoGateway {
    
    // 奖励存储结构
    struct RewardDeposit {
        address asset;      // 奖励资产地址
        uint256 amount;     // 奖励数量
        bool deposited;     // 是否已存储
        bool claimed;       // 是否已领取
        address depositor;  // 存储者地址
    }
    
    // 存储映射：taskId => RewardDeposit
    mapping(uint256 => RewardDeposit) public deposits;
    
    // TaskEscrow 合约地址
    address public taskEscrow;
    
    // 事件
    event RewardDeposited(uint256 indexed taskId, address indexed creator, address asset, uint256 amount);
    event RewardClaimed(uint256 indexed taskId, address indexed helper, address asset, uint256 amount);
    
    // 错误
    error InvalidTaskId();
    error RewardAlreadyExists();
    error RewardNotFound();
    error RewardAlreadyClaimed();
    error UnauthorizedAccess();
    error TransferFailed();
    error InvalidAmount();
    
    constructor(address _taskEscrow) {
        taskEscrow = _taskEscrow;
    }
    
    modifier onlyTaskEscrow() {
        if (msg.sender != taskEscrow) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    /**
     * @dev 存储任务奖励
     * @param taskId 任务ID
     * @param asset 奖励资产地址
     * @param amount 奖励数量
     */
    function depositReward(
        uint256 taskId,
        address asset,
        uint256 amount
    ) external {
        if (taskId == 0) revert InvalidTaskId();
        if (amount == 0) revert InvalidAmount();
        if (deposits[taskId].deposited) revert RewardAlreadyExists();
        
        // 转移资产到合约
        IZRC20 token = IZRC20(asset);
        bool success = token.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        
        // 记录存储信息
        deposits[taskId] = RewardDeposit({
            asset: asset,
            amount: amount,
            deposited: true,
            claimed: false,
            depositor: msg.sender
        });
        
        emit RewardDeposited(taskId, msg.sender, asset, amount);
    }
    
    /**
     * @dev 领取任务奖励
     * @param taskId 任务ID
     */
    function claimReward(uint256 taskId) external onlyTaskEscrow {
        RewardDeposit storage deposit = deposits[taskId];
        
        if (!deposit.deposited) revert RewardNotFound();
        if (deposit.claimed) revert RewardAlreadyClaimed();
        
        // 标记为已领取
        deposit.claimed = true;
        
        // 转移奖励给调用者（通过 TaskEscrow）
        IZRC20 token = IZRC20(deposit.asset);
        bool success = token.transfer(msg.sender, deposit.amount);
        if (!success) revert TransferFailed();
        
        emit RewardClaimed(taskId, msg.sender, deposit.asset, deposit.amount);
    }
    
    /**
     * @dev 检查任务是否有奖励
     * @param taskId 任务ID
     * @return 是否有奖励
     */
    function hasReward(uint256 taskId) external view returns (bool) {
        return deposits[taskId].deposited && !deposits[taskId].claimed;
    }
    
    /**
     * @dev 获取奖励信息
     * @param taskId 任务ID
     * @return 奖励信息结构体
     */
    function getRewardInfo(uint256 taskId) external view returns (RewardDeposit memory) {
        return deposits[taskId];
    }
    
    /**
     * @dev 获取代币余额
     * @param asset 代币地址
     * @return 余额
     */
    function getTokenBalance(address asset) external view returns (uint256) {
        return IZRC20(asset).balanceOf(address(this));
    }
}