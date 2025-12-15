// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEOCHOToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}

interface IRegister {
    function isRegistered(address account) external view returns (bool);
}

/**
 * @title TaskEscrow
 * @notice EverEcho 任务托管合约，管理任务状态流转与资金结算
 * @dev 冻结点 1.1-1：三合约分层架构，构造函数传入 Register 和 EOCHOToken 地址
 */
contract TaskEscrow {
    // ============ 状态枚举（冻结点 1.3-13）============
    enum TaskStatus { Open, InProgress, Submitted, Completed, Cancelled }

    // ============ Task 结构体（PRD 5.2 完整 13 字段 + ZetaChain 扩展 3 字段）============
    struct Task {
        uint256 taskId;
        address creator;
        address helper;
        uint256 reward;
        string taskURI;
        TaskStatus status;
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 submittedAt;
        address terminateRequestedBy;
        uint256 terminateRequestedAt;
        bool fixRequested;
        uint256 fixRequestedAt;
        // ZetaChain 扩展字段（追加在末尾）
        uint256 echoPostFee;      // 发布费用（10 ECHO）
        address rewardAsset;      // 跨链奖励资产地址
        uint256 rewardAmount;     // 跨链奖励数量
    }

    // ============ 常量（与 PRD 1.4 完全一致）============
    uint256 public constant T_OPEN = 7 days;
    uint256 public constant T_PROGRESS = 14 days;
    uint256 public constant T_REVIEW = 3 days;
    uint256 public constant T_TERMINATE_RESPONSE = 48 hours;
    uint256 public constant T_FIX_EXTENSION = 3 days;
    uint256 public constant FEE_BPS = 200; // 2%
    uint256 public constant MAX_REWARD = 1000 * 10**18; // 1000 EOCHO
    uint256 public constant TASK_POST_FEE = 10 * 10**18; // 10 EOCHO

    // ============ 状态变量 ============
    IEOCHOToken public immutable echoToken;
    IRegister public immutable registerContract;
    uint256 public taskCounter;
    mapping(uint256 => Task) public tasks;

    // ============ 事件（与 PRD 5.2 完全一致）============
    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI);
    event TaskAccepted(uint256 indexed taskId, address indexed helper);
    event TaskSubmitted(uint256 indexed taskId);
    event TaskCompleted(uint256 indexed taskId, uint256 helperReceived, uint256 feeBurned);
    event TaskCancelled(uint256 indexed taskId, string reason);
    event TerminateRequested(uint256 indexed taskId, address indexed requestedBy);
    event TerminateAgreed(uint256 indexed taskId);
    event FixRequested(uint256 indexed taskId);

    // ============ 错误 ============
    error NotRegistered();
    error InvalidReward();
    error InvalidStatus();
    error Unauthorized();
    error Timeout();
    error AlreadyRequested();

    // ============ 构造函数 ============
    /**
     * @notice 初始化 TaskEscrow 合约
     * @param _echoToken EOCHOToken 合约地址
     * @param _registerContract Register 合约地址
     * @dev 冻结点 1.1-1：构造函数传入 Register 地址与 EOCHOToken 地址
     */
    constructor(address _echoToken, address _registerContract) {
        require(_echoToken != address(0) && _registerContract != address(0), "Invalid address");
        echoToken = IEOCHOToken(_echoToken);
        registerContract = IRegister(_registerContract);
    }

    // ============ 核心函数 ============

    /**
     * @notice 创建任务（向后兼容版本）
     * @param reward 任务奖励金额
     * @param taskURI 任务元数据 URI
     * @return taskId 任务 ID
     */
    function createTask(uint256 reward, string calldata taskURI) external returns (uint256) {
        return _createTask(reward, taskURI, address(0), 0);
    }

    /**
     * @notice 创建任务（带跨链奖励）
     * @param reward 任务奖励金额
     * @param taskURI 任务元数据 URI
     * @param rewardAsset 跨链奖励资产地址
     * @param rewardAmount 跨链奖励数量
     * @return taskId 任务 ID
     */
    function createTaskWithReward(
        uint256 reward, 
        string calldata taskURI,
        address rewardAsset,
        uint256 rewardAmount
    ) external returns (uint256) {
        return _createTask(reward, taskURI, rewardAsset, rewardAmount);
    }

    /**
     * @notice 内部创建任务实现
     * @param reward 任务奖励金额
     * @param taskURI 任务元数据 URI
     * @param rewardAsset 跨链奖励资产地址
     * @param rewardAmount 跨链奖励数量
     * @return taskId 任务 ID
     * @dev 冻结点 1.1-4：验证 isRegistered
     * @dev 冻结点 1.2-10：reward > 0 && reward <= MAX_REWARD
     * @dev 冻结点 1.3-14：Creator 抵押 reward + postFee
     */
    function _createTask(
        uint256 reward,
        string calldata taskURI,
        address rewardAsset,
        uint256 rewardAmount
    ) internal returns (uint256) {
        // 注册验证（冻结点 1.1-4）
        if (!registerContract.isRegistered(msg.sender)) revert NotRegistered();
        
        // reward 范围检查（冻结点 1.2-10）
        if (reward == 0 || reward > MAX_REWARD) revert InvalidReward();
        
        // 生成 taskId
        taskCounter++;
        uint256 taskId = taskCounter;
        
        // 创建任务
        Task storage task = tasks[taskId];
        task.taskId = taskId;
        task.creator = msg.sender;
        task.helper = address(0);
        task.reward = reward;
        task.taskURI = taskURI;
        task.status = TaskStatus.Open;
        task.createdAt = block.timestamp;
        // 设置新增字段
        task.echoPostFee = TASK_POST_FEE;
        task.rewardAsset = rewardAsset;
        task.rewardAmount = rewardAmount;
        
        // Creator 抵押 reward + postFee（冻结点 1.3-14）
        uint256 totalLock = reward + TASK_POST_FEE;
        require(echoToken.transferFrom(msg.sender, address(this), totalLock), "Transfer failed");
        
        emit TaskCreated(taskId, msg.sender, reward, taskURI);
        return taskId;
    }

    /**
     * @notice Creator 取消 Open 状态任务
     * @param taskId 任务 ID
     * @dev 冻结点 1.3-16：InProgress 不可单方取消
     */
    function cancelTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 权限与状态检查
        if (msg.sender != task.creator) revert Unauthorized();
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        
        // 立即锁定状态
        task.status = TaskStatus.Cancelled;
        
        // 先退 postFee，再退 reward
        _refundPostFeeToCreator(taskId);
        require(echoToken.transfer(task.creator, task.reward), "Transfer failed");
        
        emit TaskCancelled(taskId, "Cancelled by creator");
    }

    /**
     * @notice Open 状态超时取消（任何人可触发）
     * @param taskId 任务 ID
     * @dev 冻结点 1.4-19：T_OPEN = 7 days
     */
    function cancelTaskTimeout(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 状态与超时检查
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        if (block.timestamp <= task.createdAt + T_OPEN) revert Timeout();
        
        // 立即锁定状态
        task.status = TaskStatus.Cancelled;
        
        // 先退 postFee，再退 reward
        _refundPostFeeToCreator(taskId);
        require(echoToken.transfer(task.creator, task.reward), "Transfer failed");
        
        emit TaskCancelled(taskId, "Timeout in Open");
    }

    /**
     * @notice Helper 接受任务（抵押 reward）
     * @param taskId 任务 ID
     * @dev 冻结点 1.1-4：验证 isRegistered
     * @dev 冻结点 1.3-14：Helper 抵押 R
     */
    function acceptTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 注册验证（冻结点 1.1-4）
        if (!registerContract.isRegistered(msg.sender)) revert NotRegistered();
        
        // 状态与权限检查
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        if (msg.sender == task.creator) revert Unauthorized();
        
        // Helper 抵押 reward（冻结点 1.3-14）
        require(echoToken.transferFrom(msg.sender, address(this), task.reward), "Transfer failed");
        
        // 更新任务状态
        task.helper = msg.sender;
        task.status = TaskStatus.InProgress;
        task.acceptedAt = block.timestamp;
        
        emit TaskAccepted(taskId, msg.sender);
    }

    /**
     * @notice Helper 提交工作
     * @param taskId 任务 ID
     */
    function submitWork(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 权限与状态检查
        if (msg.sender != task.helper) revert Unauthorized();
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        
        // 更新状态
        task.status = TaskStatus.Submitted;
        task.submittedAt = block.timestamp;
        
        emit TaskSubmitted(taskId);
    }

    /**
     * @notice Creator 确认完成并结算
     * @param taskId 任务 ID
     * @dev 冻结点 1.2-9：fee = reward * FEE_BPS / 10000
     * @dev 冻结点 1.3-15：Helper 得 0.98R，0.02R burn，Helper 保证金退回
     */
    function confirmComplete(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 权限与状态检查
        if (msg.sender != task.creator) revert Unauthorized();
        if (task.status != TaskStatus.Submitted) revert InvalidStatus();
        
        // 缓存关键数值（gas 优化 + 防重入）
        uint256 reward = task.reward;
        uint256 postFee = task.echoPostFee;
        address helper = task.helper;
        
        // 计算手续费（冻结点 1.2-9）
        uint256 fee = (reward * FEE_BPS) / 10000;
        uint256 helperReward = reward - fee;
        
        // 立即锁定状态和清零 postFee（防重入）
        task.status = TaskStatus.Completed;
        task.echoPostFee = 0;
        
        // 合并 Helper 转账（gas 优化）：0.98R + 保证金 + postFee
        uint256 totalHelperPayout = helperReward + reward + postFee;
        require(echoToken.transfer(helper, totalHelperPayout), "Helper payout failed");
        
        // 销毁 0.02R（从 Creator 抵押）
        echoToken.burn(fee);
        
        emit TaskCompleted(taskId, helperReward, fee);
    }

    /**
     * @notice Submitted 超时自动完成（任何人可触发）
     * @param taskId 任务 ID
     * @dev 冻结点 1.4-20：验收截止 = submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0)
     */
    function completeTimeout(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 状态检查
        if (task.status != TaskStatus.Submitted) revert InvalidStatus();
        
        // 超时检查（冻结点 1.4-20）
        uint256 deadline = task.submittedAt + T_REVIEW;
        if (task.fixRequested) {
            deadline += T_FIX_EXTENSION;
        }
        if (block.timestamp <= deadline) revert Timeout();
        
        // 计算手续费
        uint256 fee = (task.reward * FEE_BPS) / 10000;
        uint256 helperReceived = task.reward - fee;
        
        // 缓存关键数值（gas 优化 + 防重入）
        uint256 reward = task.reward;
        uint256 postFee = task.echoPostFee;
        address helper = task.helper;
        
        // 立即锁定状态和清零 postFee（防重入）
        task.status = TaskStatus.Completed;
        task.echoPostFee = 0;
        
        // 合并 Helper 转账（gas 优化）：0.98R + 保证金 + postFee
        uint256 totalHelperPayout = helperReceived + reward + postFee;
        require(echoToken.transfer(helper, totalHelperPayout), "Helper payout failed");
        
        // 销毁 0.02R（从 Creator 抵押）
        echoToken.burn(fee);
        
        emit TaskCompleted(taskId, helperReceived, fee);
    }

    /**
     * @notice InProgress 超时关闭（任何人可触发）
     * @param taskId 任务 ID
     * @dev 冻结点 1.4-19：T_PROGRESS = 14 days
     * @dev 冻结点 1.3-18：双方各拿回 R
     */
    function progressTimeout(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 状态与超时检查
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        if (block.timestamp <= task.acceptedAt + T_PROGRESS) revert Timeout();
        
        // 立即锁定状态
        task.status = TaskStatus.Cancelled;
        
        // 先退 postFee，再退双方抵押（冻结点 1.3-18）
        _refundPostFeeToCreator(taskId);
        require(echoToken.transfer(task.creator, task.reward), "Creator refund failed");
        require(echoToken.transfer(task.helper, task.reward), "Helper refund failed");
        
        emit TaskCancelled(taskId, "Timeout in InProgress");
    }

    // ============ P1-C4: 协商终止机制 ============

    /**
     * @notice 请求终止任务（InProgress 状态）
     * @param taskId 任务 ID
     * @dev 冻结点 1.3-16：InProgress 状态 Creator 不可单方取消，只能协商终止
     */
    function requestTerminate(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 状态检查
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        
        // 权限检查：仅 Creator 或 Helper
        if (msg.sender != task.creator && msg.sender != task.helper) revert Unauthorized();
        
        // 记录请求
        task.terminateRequestedBy = msg.sender;
        task.terminateRequestedAt = block.timestamp;
        
        emit TerminateRequested(taskId, msg.sender);
    }

    /**
     * @notice 同意终止任务（对方响应）
     * @param taskId 任务 ID
     * @dev 冻结点 1.4-21：agreeTerminate 需时间检查
     * @dev 冻结点 1.3-18：双方各拿回 R，状态变 Cancelled
     */
    function agreeTerminate(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 状态检查
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        
        // 请求存在性检查
        if (task.terminateRequestedBy == address(0)) revert Unauthorized();
        
        // 权限检查：仅对方（非发起者）
        if (msg.sender != task.creator && msg.sender != task.helper) revert Unauthorized();
        if (msg.sender == task.terminateRequestedBy) revert Unauthorized();
        
        // 时间窗检查（冻结点 1.4-21）
        if (block.timestamp > task.terminateRequestedAt + T_TERMINATE_RESPONSE) revert Timeout();
        
        // 立即锁定状态
        task.status = TaskStatus.Cancelled;
        
        // 重置终止请求字段
        task.terminateRequestedBy = address(0);
        task.terminateRequestedAt = 0;
        
        // 先退 postFee，再退双方抵押（冻结点 1.3-18）
        _refundPostFeeToCreator(taskId);
        require(echoToken.transfer(task.creator, task.reward), "Creator refund failed");
        require(echoToken.transfer(task.helper, task.reward), "Helper refund failed");
        
        emit TerminateAgreed(taskId);
        emit TaskCancelled(taskId, "Mutually terminated");
    }

    /**
     * @notice 终止请求超时失效（任何人可触发）
     * @param taskId 任务 ID
     * @dev 冻结点 1.4-19：T_TERMINATE_RESPONSE = 48 hours
     */
    function terminateTimeout(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 状态检查
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        
        // 请求存在性检查
        if (task.terminateRequestedBy == address(0)) revert Unauthorized();
        
        // 超时检查
        if (block.timestamp <= task.terminateRequestedAt + T_TERMINATE_RESPONSE) revert Timeout();
        
        // 重置请求字段（不改变状态，不移动资金）
        task.terminateRequestedBy = address(0);
        task.terminateRequestedAt = 0;
        
        // 无事件触发（按薄片要求）
    }

    // ============ P1-C5: Request Fix 机制 ============

    /**
     * @notice Creator 请求修正（Submitted 状态，仅一次）
     * @param taskId 任务 ID
     * @dev 冻结点 1.3-17：Submitted 状态 Creator 不可取消，仅支持 confirmComplete / requestFix（一次）/ 超时完成
     * @dev 冻结点 1.4-20：Request Fix 不刷新 submittedAt，延长验收期 T_FIX_EXTENSION
     */
    function requestFix(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        // 权限检查：仅 Creator
        if (msg.sender != task.creator) revert Unauthorized();
        
        // 状态检查：仅 Submitted
        if (task.status != TaskStatus.Submitted) revert InvalidStatus();
        
        // 防重复检查：每个任务最多一次
        if (task.fixRequested) revert AlreadyRequested();
        
        // 记录请求（不刷新 submittedAt）
        task.fixRequested = true;
        task.fixRequestedAt = block.timestamp;
        
        emit FixRequested(taskId);
    }

    // ============ 内部辅助函数 ============

    /**
     * @notice 退回 postFee 给 Creator（防重复）
     * @param taskId 任务 ID
     */
    function _refundPostFeeToCreator(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        if (task.echoPostFee > 0) {
            uint256 postFee = task.echoPostFee;
            task.echoPostFee = 0;  // 先清零防重复
            require(echoToken.transfer(task.creator, postFee), "PostFee refund failed");
        }
    }

    // ============ View 方法（供 Gateway 使用）============

    /**
     * @notice 获取任务创建者地址
     * @param taskId 任务 ID
     * @return creator 创建者地址
     */
    function getTaskCreator(uint256 taskId) external view returns (address) {
        return tasks[taskId].creator;
    }

    /**
     * @notice 获取任务执行者地址
     * @param taskId 任务 ID
     * @return helper 执行者地址
     */
    function getTaskHelper(uint256 taskId) external view returns (address) {
        return tasks[taskId].helper;
    }

    /**
     * @notice 获取任务状态
     * @param taskId 任务 ID
     * @return status 任务状态
     */
    function getTaskStatus(uint256 taskId) external view returns (TaskStatus) {
        return tasks[taskId].status;
    }
}
