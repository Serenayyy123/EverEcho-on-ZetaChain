// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

/**
 * @title EverEchoUniversalReward
 * @dev 跨链奖励 Escrow + 状态机 + onRevert 兜底
 * 
 * 核心设计原则：
 * 1. 独立于 TaskEscrow，不依赖其内部状态
 * 2. 强状态机，防止重复操作
 * 3. onRevert 保障，跨链失败可恢复
 * 4. 幂等性，同一操作不可重复执行
 */
contract EverEchoUniversalReward is zContract, OnlySystem {
    
    // 状态枚举
    enum RewardStatus { 
        Prepared,   // 计划创建，未存款
        Deposited,  // 已存款，可撤回
        Locked,     // 已锁定给任务，不可撤回
        Claimed,    // 已被 Helper 领取
        Refunded,   // 已退款给 Creator
        Reverted    // 跨链失败，等待退款
    }
    
    // 奖励计划结构
    struct RewardPlan {
        uint256 rewardId;
        address creator;
        uint256 taskId;          // 0 表示未绑定
        address asset;           // ZRC20 地址
        uint256 amount;
        uint256 targetChainId;   // 目标链 ID
        address targetAddress;   // Helper 地址（在目标链）
        RewardStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        bytes32 lastTxHash;      // 最后一次跨链交易 hash
    }
    
    // 存储
    mapping(uint256 => RewardPlan) public rewardPlans;
    mapping(address => uint256[]) public creatorRewards;
    mapping(uint256 => uint256) public taskRewards; // taskId => rewardId
    
    uint256 public nextRewardId = 1;
    SystemContract public systemContract;
    
    // 授权的协调器合约
    mapping(address => bool) public authorizedCoordinators;
    address public owner;
    
    // 事件
    event RewardPlanCreated(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount);
    event RewardDeposited(uint256 indexed rewardId, address indexed creator, uint256 amount);
    event RewardLocked(uint256 indexed rewardId, uint256 indexed taskId);
    event RewardClaimed(uint256 indexed rewardId, address indexed helper, bytes32 txHash);
    event RewardRefunded(uint256 indexed rewardId, address indexed creator);
    event RewardReverted(uint256 indexed rewardId, string reason);
    
    // 错误
    error InvalidRewardId();
    error UnauthorizedAccess();
    error InvalidStatus();
    error InvalidAmount();
    error TaskAlreadyHasReward();
    error TransferFailed();
    error CrossChainFailed();
    
    constructor(address _systemContract) {
        systemContract = SystemContract(_systemContract);
        owner = msg.sender;
    }
    
    modifier onlyCreator(uint256 rewardId) {
        if (rewardPlans[rewardId].creator != msg.sender && !authorizedCoordinators[msg.sender]) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    modifier validRewardId(uint256 rewardId) {
        if (rewardId == 0 || rewardId >= nextRewardId) {
            revert InvalidRewardId();
        }
        _;
    }
    
    modifier inStatus(uint256 rewardId, RewardStatus expectedStatus) {
        if (rewardPlans[rewardId].status != expectedStatus) {
            revert InvalidStatus();
        }
        _;
    }
    
    /**
     * @dev 创建奖励计划
     * @param asset ZRC20 代币地址
     * @param amount 奖励数量
     * @param targetChainId 目标链 ID
     * @return rewardId 奖励计划 ID
     */
    function preparePlan(
        address asset,
        uint256 amount,
        uint256 targetChainId
    ) external returns (uint256 rewardId) {
        if (amount == 0) revert InvalidAmount();
        
        rewardId = nextRewardId++;
        
        rewardPlans[rewardId] = RewardPlan({
            rewardId: rewardId,
            creator: msg.sender,
            taskId: 0, // 未绑定
            asset: asset,
            amount: amount,
            targetChainId: targetChainId,
            targetAddress: address(0), // 稍后设置
            status: RewardStatus.Prepared,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            lastTxHash: bytes32(0)
        });
        
        creatorRewards[msg.sender].push(rewardId);
        
        emit RewardPlanCreated(rewardId, msg.sender, asset, amount);
    }
    
    /**
     * @dev 存入奖励资金
     * @param rewardId 奖励计划 ID
     */
    function deposit(uint256 rewardId) 
        external 
        payable
        validRewardId(rewardId)
        onlyCreator(rewardId)
        inStatus(rewardId, RewardStatus.Prepared)
    {
        RewardPlan storage plan = rewardPlans[rewardId];
        
        // 处理 ETH 或 ZRC20 代币
        if (plan.asset == address(0)) {
            // ETH 存款
            if (msg.value != plan.amount) revert InvalidAmount();
        } else {
            // ZRC20 代币存款
            if (msg.value != 0) revert InvalidAmount();
            
            IZRC20 token = IZRC20(plan.asset);
            bool success = token.transferFrom(msg.sender, address(this), plan.amount);
            if (!success) revert TransferFailed();
        }
        
        plan.status = RewardStatus.Deposited;
        plan.updatedAt = block.timestamp;
        
        emit RewardDeposited(rewardId, msg.sender, plan.amount);
    }
    
    /**
     * @dev 锁定奖励给特定任务
     * @param rewardId 奖励计划 ID
     * @param taskId 任务 ID
     */
    function lockForTask(uint256 rewardId, uint256 taskId)
        external
        validRewardId(rewardId)
        onlyCreator(rewardId)
        inStatus(rewardId, RewardStatus.Deposited)
    {
        if (taskId == 0) revert InvalidAmount();
        if (taskRewards[taskId] != 0) revert TaskAlreadyHasReward();
        
        RewardPlan storage plan = rewardPlans[rewardId];
        plan.taskId = taskId;
        plan.status = RewardStatus.Locked;
        plan.updatedAt = block.timestamp;
        
        taskRewards[taskId] = rewardId;
        
        emit RewardLocked(rewardId, taskId);
    }
    
    /**
     * @dev Helper 领取跨链奖励
     * @param rewardId 奖励计划 ID
     * @param helperAddress Helper 在目标链的地址
     */
    function claimToHelper(uint256 rewardId, address helperAddress)
        external
        validRewardId(rewardId)
        inStatus(rewardId, RewardStatus.Locked)
    {
        RewardPlan storage plan = rewardPlans[rewardId];
        
        // 简化权限检查：任何人都可以触发，但资金只能发给指定的 helperAddress
        // 在实际应用中，可以通过 TaskEscrow 验证 msg.sender 是否为该任务的 helper
        
        plan.targetAddress = helperAddress;
        
        // 执行跨链转账
        bytes32 txHash = _executeCrossChainTransfer(plan);
        
        plan.status = RewardStatus.Claimed;
        plan.updatedAt = block.timestamp;
        plan.lastTxHash = txHash;
        
        emit RewardClaimed(rewardId, helperAddress, txHash);
    }
    
    /**
     * @dev 退款给 Creator
     * @param rewardId 奖励计划 ID
     */
    function refund(uint256 rewardId)
        external
        validRewardId(rewardId)
        onlyCreator(rewardId)
    {
        RewardPlan storage plan = rewardPlans[rewardId];
        
        // 只有特定状态可以退款
        if (plan.status != RewardStatus.Prepared && 
            plan.status != RewardStatus.Deposited && 
            plan.status != RewardStatus.Locked &&
            plan.status != RewardStatus.Reverted) {
            revert InvalidStatus();
        }
        
        // 如果已锁定给任务，清除任务绑定
        if (plan.taskId != 0) {
            delete taskRewards[plan.taskId];
        }
        
        // 退还资金
        if (plan.status == RewardStatus.Deposited || 
            plan.status == RewardStatus.Locked || 
            plan.status == RewardStatus.Reverted) {
            _refundToCreator(plan);
        }
        
        plan.status = RewardStatus.Refunded;
        plan.updatedAt = block.timestamp;
        
        emit RewardRefunded(rewardId, plan.creator);
    }
    
    /**
     * @dev ZetaChain 系统回调：跨链失败时触发
     */
    function onRevert(RevertContext calldata revertContext) 
        external 
        onlySystem 
    {
        // 从 revertContext 中解析 rewardId
        // 这里简化处理，实际应该从 revertContext.revertMessage 中解析
        uint256 rewardId = abi.decode(revertContext.revertMessage, (uint256));
        
        if (rewardId == 0 || rewardId >= nextRewardId) return;
        
        RewardPlan storage plan = rewardPlans[rewardId];
        
        // 只有 Locked 状态的奖励可以被 revert
        if (plan.status == RewardStatus.Locked) {
            plan.status = RewardStatus.Reverted;
            plan.updatedAt = block.timestamp;
            
            emit RewardReverted(rewardId, "Cross-chain transfer failed");
        }
    }
    
    /**
     * @dev 执行跨链转账
     */
    function _executeCrossChainTransfer(RewardPlan memory plan) 
        private 
        returns (bytes32 txHash) 
    {
        if (plan.asset == address(0)) {
            // ETH 跨链转账
            (bool success, bytes memory data) = systemContract.wZetaContractAddress().call{
                value: plan.amount
            }(
                abi.encodeWithSignature(
                    "withdraw(bytes,uint256,address)",
                    abi.encode(plan.targetAddress),
                    plan.amount,
                    plan.targetChainId
                )
            );
            
            if (!success) revert CrossChainFailed();
            txHash = keccak256(data);
        } else {
            // ZRC20 代币跨链转账
            IZRC20 token = IZRC20(plan.asset);
            
            // 使用 ZRC20 的 withdraw 功能
            try token.withdraw(
                abi.encode(plan.targetAddress), 
                plan.amount
            ) {
                txHash = keccak256(abi.encode(plan.rewardId, block.timestamp));
            } catch {
                revert CrossChainFailed();
            }
        }
    }
    
    /**
     * @dev 退款给 Creator
     */
    function _refundToCreator(RewardPlan memory plan) private {
        if (plan.asset == address(0)) {
            // 退还 ETH
            (bool success, ) = plan.creator.call{value: plan.amount}("");
            if (!success) revert TransferFailed();
        } else {
            // 退还 ZRC20 代币
            IZRC20 token = IZRC20(plan.asset);
            bool success = token.transfer(plan.creator, plan.amount);
            if (!success) revert TransferFailed();
        }
    }
    
    // 查询函数
    function getRewardPlan(uint256 rewardId) 
        external 
        view 
        validRewardId(rewardId)
        returns (RewardPlan memory) 
    {
        return rewardPlans[rewardId];
    }
    
    function getRewardsByCreator(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorRewards[creator];
    }
    
    function getRewardByTask(uint256 taskId) 
        external 
        view 
        returns (uint256) 
    {
        return taskRewards[taskId];
    }
    
    // 协调器管理函数
    function authorizeCoordinator(address coordinator) external onlyOwner {
        authorizedCoordinators[coordinator] = true;
    }
    
    function revokeCoordinator(address coordinator) external onlyOwner {
        authorizedCoordinators[coordinator] = false;
    }
    
    /**
     * @dev 委托创建奖励计划（供协调器调用）
     * @param creator 实际的创建者地址
     * @param asset ZRC20 代币地址
     * @param amount 奖励数量
     * @param targetChainId 目标链 ID
     * @return rewardId 奖励计划 ID
     */
    function preparePlanFor(
        address creator,
        address asset,
        uint256 amount,
        uint256 targetChainId
    ) external returns (uint256 rewardId) {
        require(authorizedCoordinators[msg.sender], "Unauthorized coordinator");
        
        if (amount == 0) revert InvalidAmount();
        
        rewardId = nextRewardId++;
        
        rewardPlans[rewardId] = RewardPlan({
            rewardId: rewardId,
            creator: creator, // 使用实际创建者地址
            taskId: 0,
            asset: asset,
            amount: amount,
            targetChainId: targetChainId,
            targetAddress: address(0),
            status: RewardStatus.Prepared,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            lastTxHash: bytes32(0)
        });
        
        creatorRewards[creator].push(rewardId);
        
        emit RewardPlanCreated(rewardId, creator, asset, amount);
    }
    
    // 紧急函数（仅管理员）
    function emergencyWithdraw(address asset, uint256 amount) 
        external 
        onlySystem 
    {
        if (asset == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IZRC20(asset).transfer(msg.sender, amount);
        }
    }
}