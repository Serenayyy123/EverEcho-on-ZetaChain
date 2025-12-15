// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @notice ERC20 标准接口，用于 ZRC20 代币操作
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function symbol() external view returns (string memory);
}

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
 * @notice 跨链奖励托管入口（ZRC20 真实锁仓+发放）
 * @dev Stage 4.7: 升级为真实 ZRC20 代币锁仓和发放系统
 */
contract EverEchoGateway {
    // ============ 状态枚举（与 TaskEscrow 保持一致）============
    enum TaskStatus { Open, InProgress, Submitted, Completed, Cancelled }

    // ============ 状态变量 ============
    ITaskEscrow public immutable taskEscrow;

    struct RewardDeposit {
        address asset;       // ZRC20 token address
        uint256 amount;      // amount locked
        bool deposited;      // has deposit happened
        bool claimed;        // has claim happened
        address depositor;   // creator address snapshot
    }

    mapping(uint256 => RewardDeposit) public deposits;

    // ============ 事件 ============
    event RewardDeposited(uint256 indexed taskId, address indexed creator, address asset, uint256 amount);
    event RewardClaimed(uint256 indexed taskId, address indexed helper, address asset, uint256 amount);

    // ============ 错误 ============
    error TaskNotFound();
    error Unauthorized();
    error InvalidStatus();
    error InvalidAsset();
    error InvalidAmount();
    error AlreadyDeposited();
    error NotDeposited();
    error AlreadyClaimed();
    error TransferFailed();

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
     * @notice 存入跨链奖励（真实 ZRC20 锁仓）
     * @param taskId 任务 ID
     * @param asset ZRC20 代币地址
     * @param amount 跨链奖励数量
     * @dev 仅任务 creator 可调用，执行真实 transferFrom 锁仓
     */
    function depositReward(uint256 taskId, address asset, uint256 amount) external {
        // 检查 task 存在：creator != address(0)
        address creator = taskEscrow.getTaskCreator(taskId);
        if (creator == address(0)) revert TaskNotFound();

        // 权限：msg.sender 必须是 creator
        if (msg.sender != creator) revert Unauthorized();

        // 参数：asset != 0, amount > 0
        if (asset == address(0)) revert InvalidAsset();
        if (amount == 0) revert InvalidAmount();

        // 防重复：deposited=true 则 revert
        if (deposits[taskId].deposited) revert AlreadyDeposited();

        // 真实转账：transferFrom(creator, gateway, amount)
        bool success = IERC20(asset).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        // 写入 deposits[taskId]
        deposits[taskId] = RewardDeposit({
            asset: asset,
            amount: amount,
            deposited: true,
            claimed: false,
            depositor: creator
        });

        emit RewardDeposited(taskId, creator, asset, amount);
    }

    /**
     * @notice 领取跨链奖励（真实 ZRC20 发放）
     * @param taskId 任务 ID
     * @dev 仅任务 helper 且任务已完成可调用，执行真实 transfer 发放
     */
    function claimReward(uint256 taskId) external {
        // 检查 task 存在
        address helper = taskEscrow.getTaskHelper(taskId);
        if (helper == address(0)) revert TaskNotFound();

        // 检查 deposits[taskId].deposited == true
        RewardDeposit storage deposit = deposits[taskId];
        if (!deposit.deposited) revert NotDeposited();

        // 防重复：claimed=true revert
        if (deposit.claimed) revert AlreadyClaimed();

        // 状态：getTaskStatus(taskId) == Completed 才允许领取
        uint8 status = taskEscrow.getTaskStatus(taskId);
        if (status != uint8(TaskStatus.Completed)) revert InvalidStatus();

        // 权限：msg.sender == helper
        if (msg.sender != helper) revert Unauthorized();

        // 先置 claimed=true 再外部调用（防重放/重入）
        deposit.claimed = true;

        // 真实转账：transfer(helper, amount)
        bool success = IERC20(deposit.asset).transfer(helper, deposit.amount);
        if (!success) revert TransferFailed();

        emit RewardClaimed(taskId, helper, deposit.asset, deposit.amount);
    }

    // ============ View 方法 ============

    /**
     * @notice 查询跨链奖励信息
     * @param taskId 任务 ID
     * @return asset 资产地址
     * @return amount 奖励数量
     * @return deposited 是否已存入
     * @return claimed 是否已领取
     * @return depositor 存入者地址
     */
    function getRewardInfo(uint256 taskId) external view returns (
        address asset, 
        uint256 amount, 
        bool deposited, 
        bool claimed, 
        address depositor
    ) {
        RewardDeposit storage deposit = deposits[taskId];
        return (deposit.asset, deposit.amount, deposit.deposited, deposit.claimed, deposit.depositor);
    }

    /**
     * @notice 检查是否有跨链奖励
     * @param taskId 任务 ID
     * @return exists 是否有跨链奖励
     */
    function hasReward(uint256 taskId) external view returns (bool exists) {
        return deposits[taskId].deposited;
    }

    /**
     * @notice 获取 Gateway 中指定代币的余额
     * @param asset 代币地址
     * @return balance Gateway 中的代币余额
     */
    function getTokenBalance(address asset) external view returns (uint256 balance) {
        return IERC20(asset).balanceOf(address(this));
    }
}