import { ethers } from "hardhat";

/**
 * 修复TaskEscrow双重收费问题的解决方案
 * 
 * 问题：createTaskWithCrossChainReward函数同时扣除ECHO代币和原生代币
 * 解决方案：统一使用ECHO代币，TaskEscrow合约内部处理原生代币转换
 */

async function analyzeDoubleChargingIssue() {
    console.log("=== TaskEscrow双重收费问题分析 ===");
    
    console.log("\n当前问题：");
    console.log("1. _createTask() 扣除: reward + TASK_POST_FEE (ECHO代币)");
    console.log("2. createTaskWithCrossChainReward() 还要求: msg.value (原生代币)");
    console.log("3. 用户被双重收费");
    
    console.log("\n解决方案选项：");
    
    console.log("\n方案1：统一使用ECHO代币（推荐）");
    console.log("- 修改createTaskWithCrossChainReward，不要求msg.value");
    console.log("- TaskEscrow合约预存一些原生代币用于跨链操作");
    console.log("- 或者添加一个兑换机制，将ECHO转换为原生代币");
    console.log("- 优点：用户体验一致，只需要ECHO代币");
    console.log("- 缺点：需要合约预存资金或兑换机制");
    
    console.log("\n方案2：分离两种支付方式");
    console.log("- 修改_createTask，当有跨链奖励时不扣除ECHO");
    console.log("- 只使用原生代币支付跨链奖励");
    console.log("- 优点：逻辑清晰，避免双重收费");
    console.log("- 缺点：用户需要准备两种代币");
    
    console.log("\n方案3：添加支付方式选择");
    console.log("- 让用户选择用ECHO还是原生代币支付");
    console.log("- 根据选择调用不同的函数");
    console.log("- 优点：灵活性高");
    console.log("- 缺点：增加复杂性");
    
    return {
        currentIssue: "双重收费：ECHO + 原生代币",
        recommendedSolution: "方案1：统一使用ECHO代币",
        impact: "不影响现有createTask功能，只修改跨链奖励逻辑"
    };
}

async function generateFixedContract() {
    console.log("\n=== 生成修复后的合约代码 ===");
    
    const fixedContractCode = `
    /**
     * @notice 原子化创建任务和跨链奖励（修复版 - 避免双重收费）
     * @param reward 任务奖励金额（ECHO）
     * @param taskURI 任务元数据 URI
     * @param crossChainAsset 跨链奖励资产地址
     * @param crossChainAmount 跨链奖励数量（以ECHO计价）
     * @param targetChainId 目标链ID
     * @return taskId 任务 ID
     * @return rewardId 跨链奖励 ID
     * @dev 修复版：只扣除ECHO代币，避免双重收费
     */
    function createTaskWithCrossChainReward(
        uint256 reward,
        string calldata taskURI,
        address crossChainAsset,
        uint256 crossChainAmount,
        uint256 targetChainId
    ) external returns (uint256 taskId, uint256 rewardId) {
        // 1. 计算总的ECHO代币需求
        uint256 totalEchoRequired = reward + TASK_POST_FEE;
        if (crossChainAmount > 0) {
            // 跨链奖励也用ECHO代币计价
            totalEchoRequired += crossChainAmount;
        }
        
        // 2. 一次性扣除所有ECHO代币
        require(echoToken.transferFrom(msg.sender, address(this), totalEchoRequired), "Transfer failed");
        
        // 3. 创建任务（使用内部逻辑，不重复扣费）
        taskId = _createTaskInternal(reward, taskURI, crossChainAsset, crossChainAmount);
        
        // 4. 如果有跨链奖励，处理跨链部分
        if (crossChainAmount > 0) {
            // 将ECHO代币转换为原生代币（或使用预存的原生代币）
            uint256 nativeAmount = convertEchoToNative(crossChainAmount);
            
            // 调用UniversalReward（使用合约自有的原生代币）
            address universalReward = getUniversalRewardAddress();
            if (universalReward != address(0)) {
                rewardId = IUniversalReward(universalReward).createAndLockReward{value: nativeAmount}(
                    msg.sender,
                    crossChainAsset,
                    nativeAmount,
                    targetChainId,
                    taskId
                );
            }
        }
        
        emit TaskWithCrossChainRewardCreated(taskId, rewardId, msg.sender, reward, crossChainAmount, targetChainId);
    }
    
    /**
     * @notice 内部创建任务函数（不扣费版本）
     */
    function _createTaskInternal(
        uint256 reward,
        string calldata taskURI,
        address rewardAsset,
        uint256 rewardAmount
    ) internal returns (uint256) {
        // 注册验证
        if (!registerContract.isRegistered(msg.sender)) revert NotRegistered();
        
        // reward 范围检查
        if (reward == 0 || reward > MAX_REWARD) revert InvalidReward();
        
        // 生成 taskId
        taskCounter++;
        uint256 taskId = taskCounter;
        
        // 创建任务（不扣费，因为调用方已经处理了扣费）
        Task storage task = tasks[taskId];
        task.taskId = taskId;
        task.creator = msg.sender;
        task.helper = address(0);
        task.reward = reward;
        task.taskURI = taskURI;
        task.status = TaskStatus.Open;
        task.createdAt = block.timestamp;
        task.echoPostFee = TASK_POST_FEE;
        task.rewardAsset = rewardAsset;
        task.rewardAmount = rewardAmount;
        
        emit TaskCreated(taskId, msg.sender, reward, taskURI);
        return taskId;
    }
    
    /**
     * @notice 将ECHO代币转换为原生代币的汇率
     * @dev 简化版本，实际应该使用预言机或DEX
     */
    function convertEchoToNative(uint256 echoAmount) internal pure returns (uint256) {
        // 简化：1 ECHO = 1 原生代币
        // 实际应该使用真实汇率
        return echoAmount;
    }
    
    /**
     * @notice 合约接收原生代币（用于跨链操作）
     */
    receive() external payable {
        // 允许合约接收原生代币用于跨链操作
    }
    
    /**
     * @notice 管理员充值原生代币（用于跨链操作）
     */
    function depositNativeForCrossChain() external payable {
        require(msg.value > 0, "Must send some native tokens");
        // 事件记录
        emit NativeTokenDeposited(msg.sender, msg.value);
    }
    `;
    
    console.log("修复后的合约代码已生成");
    console.log("主要改动：");
    console.log("1. 统一使用ECHO代币扣费");
    console.log("2. 合约内部处理ECHO到原生代币的转换");
    console.log("3. 避免用户双重支付");
    
    return fixedContractCode;
}

async function main() {
    const analysis = await analyzeDoubleChargingIssue();
    console.log("\n分析结果：", analysis);
    
    const fixedCode = await generateFixedContract();
    
    console.log("\n=== 实施建议 ===");
    console.log("1. 采用方案1：统一使用ECHO代币");
    console.log("2. 修改createTaskWithCrossChainReward函数");
    console.log("3. 添加ECHO到原生代币的转换机制");
    console.log("4. 合约预存一些原生代币用于跨链操作");
    console.log("5. 保持现有createTask函数不变");
}

if (require.main === module) {
    main().catch(console.error);
}