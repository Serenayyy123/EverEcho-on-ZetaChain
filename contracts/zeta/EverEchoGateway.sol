// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITaskEscrow
 * @notice TaskEscrow 合约接口，仅包含 Gateway 需要的 view 方法
 */
interface ITaskEscrow {
    function getTaskCreator(uint256 taskId) external view returns (address);
    function getTaskHelper(uint256 taskId) external view returns (address);
    function getTaskStatus(uint256 taskId) external view returns (uint8);
}

/**
 * @title EverEchoGateway
 * @notice 跨链奖励托管入口（占位实现）
 * @dev 本阶段仅记录跨链奖励信息，不做真实转账
 */
contract EverEchoGateway {
    // ============ 状态枚举（与 TaskEscrow 保持一致）============
    enum TaskStatus { Open, InProgress, Submitted, Completed, Cancelled }

    // ============ 状态变量 ============
    ITaskEscrow public immutable taskEscrow;

    struct RewardDeposit {
        address asset;      // 跨链奖励资产地址
        uint256 amount;     // 跨链奖励数量
        bool claimed;       // 是否已领取
    }

    mapping(uint256 => RewardDeposit) public deposits;

    // ============ 事件 ============
    event RewardDeposited(uint256 indexed taskId, address indexed creator, address asset, uint256 amount);
    event RewardClaimed(uint256 indexed taskId, address indexed helper, address asset, uint256 amount);

    // ============ 错误 ============
    error TaskNotFound();
    error NotTaskCreator();
    error NotTaskHelper();
    error TaskNotCompleted();
    error InvalidAsset();
    error InvalidAmount();
    error AlreadyDeposited();
    error NoDeposit();
    error AlreadyClaimed();

    // ============ 构造函数 ============
    /**
     * @notice 初始化 EverEchoGateway 合约
     * @param _taskEscrow TaskEscrow 合约地址
     */
    constructor(address _taskEscrow) {
        require(_taskEscrow != address(0), "Invalid TaskEscrow address");
        taskEscrow = ITaskEscrow(_taskEscrow);
    }

    // ============ 核心函数 ============

    /**
     * @notice 存入跨链奖励（仅记录，不转账）
     * @param taskId 任务 ID
     * @param asset 跨链奖励资产地址
     * @param amount 跨链奖励数量
     * @dev 仅任务 creator 可调用，本阶段不做真实转账
     */
    function depositReward(uint256 taskId, address asset, uint256 amount) external {
        // 任务存在性检查（优先于权限检查）
        address creator = taskEscrow.getTaskCreator(taskId);
        if (creator == address(0)) revert TaskNotFound();

        // 权限检查：仅 creator
        if (msg.sender != creator) revert NotTaskCreator();

        // 参数校验
        if (asset == address(0)) revert InvalidAsset();
        if (amount == 0) revert InvalidAmount();

        // 防重复检查
        if (deposits[taskId].asset != address(0)) revert AlreadyDeposited();

        // 记录 deposit（不做真实转账）
        deposits[taskId] = RewardDeposit({
            asset: asset,
            amount: amount,
            claimed: false
        });

        emit RewardDeposited(taskId, creator, asset, amount);
    }

    /**
     * @notice 领取跨链奖励（仅标记，不转账）
     * @param taskId 任务 ID
     * @dev 仅任务 helper 且任务已完成可调用，本阶段不做真实转账
     */
    function claimReward(uint256 taskId) external {
        // 任务存在性检查（优先于权限检查）
        address helper = taskEscrow.getTaskHelper(taskId);
        if (helper == address(0)) revert TaskNotFound();

        // 权限检查：仅 helper
        if (msg.sender != helper) revert NotTaskHelper();

        // 状态检查：任务必须已完成
        uint8 status = taskEscrow.getTaskStatus(taskId);
        if (status != uint8(TaskStatus.Completed)) revert TaskNotCompleted();

        // deposit 存在性检查
        RewardDeposit storage deposit = deposits[taskId];
        if (deposit.asset == address(0)) revert NoDeposit();

        // 防重复检查
        if (deposit.claimed) revert AlreadyClaimed();

        // 标记已领取（不做真实转账）
        deposit.claimed = true;

        emit RewardClaimed(taskId, helper, deposit.asset, deposit.amount);
    }

    // ============ View 方法 ============

    /**
     * @notice 查询跨链奖励信息
     * @param taskId 任务 ID
     * @return asset 资产地址
     * @return amount 奖励数量
     * @return claimed 是否已领取
     */
    function getRewardInfo(uint256 taskId) external view returns (address asset, uint256 amount, bool claimed) {
        RewardDeposit storage deposit = deposits[taskId];
        return (deposit.asset, deposit.amount, deposit.claimed);
    }

    /**
     * @notice 检查是否有跨链奖励
     * @param taskId 任务 ID
     * @return exists 是否有跨链奖励
     */
    function hasReward(uint256 taskId) external view returns (bool exists) {
        return deposits[taskId].asset != address(0);
    }
}