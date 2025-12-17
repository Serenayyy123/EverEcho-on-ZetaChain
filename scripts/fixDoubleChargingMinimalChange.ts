/**
 * 最小化修改方案：修复TaskEscrow双重收费问题
 * 
 * 目标：只修改createTaskWithCrossChainReward函数，不影响其他功能
 */

console.log("=== TaskEscrow双重收费问题 - 最小化修改方案 ===");

console.log("\n当前问题分析：");
console.log("- createTaskWithCrossChainReward() 调用 _createTask() → 扣除ECHO代币");
console.log("- createTaskWithCrossChainReward() 还要求 msg.value → 扣除原生代币");
console.log("- 用户被双重收费");

console.log("\n影响范围分析：");
console.log("✅ 不影响的功能：");
console.log("  - createTask() - 标准任务创建，只使用ECHO代币");
console.log("  - _createTask() - 内部函数，被createTask()调用");
console.log("  - 所有现有测试用例 - 都使用createTask()");
console.log("  - 前端useCreateTask.ts - 主要使用createTask()");

console.log("\n❌ 需要修改的功能：");
console.log("  - createTaskWithCrossChainReward() - 当前有双重收费问题");
console.log("  - 前端原子化操作 - 使用createTaskWithCrossChainReward()");

console.log("\n=== 最小化修改方案 ===");

console.log("\n方案：修改createTaskWithCrossChainReward逻辑");
console.log("1. 保持_createTask()不变");
console.log("2. 修改createTaskWithCrossChainReward()，避免双重扣费");
console.log("3. 明确区分ECHO奖励和跨链奖励");

const minimalFixCode = `
/**
 * @notice 原子化创建任务和跨链奖励（修复版 - 避免双重收费）
 * @param reward 任务奖励金额（ECHO）
 * @param taskURI 任务元数据 URI
 * @param crossChainAsset 跨链奖励资产地址
 * @param crossChainAmount 跨链奖励数量（原生代币）
 * @param targetChainId 目标链ID
 * @return taskId 任务 ID
 * @return rewardId 跨链奖励 ID
 * @dev 明确区分ECHO奖励和跨链奖励，避免双重收费
 */
function createTaskWithCrossChainReward(
    uint256 reward,
    string calldata taskURI,
    address crossChainAsset,
    uint256 crossChainAmount,
    uint256 targetChainId
) external payable returns (uint256 taskId, uint256 rewardId) {
    // 如果没有跨链奖励，直接调用普通创建函数
    if (crossChainAmount == 0) {
        taskId = createTask(reward, taskURI);
        return (taskId, 0);
    }
    
    // 验证原生代币支付是否充足
    require(msg.value >= crossChainAmount, "Insufficient native token payment");
    
    // 1. 创建ECHO任务部分
    taskId = _createTask(reward, taskURI, crossChainAsset, crossChainAmount);
    
    // 2. 处理跨链奖励部分
    if (crossChainAmount > 0) {
        address universalReward = getUniversalRewardAddress();
        if (universalReward != address(0)) {
            // 使用用户发送的原生代币创建跨链奖励
            rewardId = IUniversalReward(universalReward).createAndLockReward{value: crossChainAmount}(
                msg.sender,
                crossChainAsset,
                crossChainAmount,
                targetChainId,
                taskId
            );
            
            // 如果用户发送了多余的原生代币，退还给用户
            if (msg.value > crossChainAmount) {
                uint256 refund = msg.value - crossChainAmount;
                (bool success, ) = msg.sender.call{value: refund}("");
                require(success, "Refund failed");
            }
        }
    }
    
    emit TaskWithCrossChainRewardCreated(taskId, rewardId, msg.sender, reward, crossChainAmount, targetChainId);
}
`;

console.log("\n修复后的合约代码：");
console.log(minimalFixCode);

console.log("\n前端调用逻辑：");
const frontendLogic = `
// 在前端 useCreateTask.ts 中：

const createTaskWithRewards = async (taskData) => {
    const { echoReward, crossChainAmount, ...otherData } = taskData;
    
    if (crossChainAmount > 0) {
        // 混合模式：明确告知用户需要支付两种代币
        console.warn("此任务需要支付ECHO代币和原生代币");
        return await taskEscrow.createTaskWithCrossChainReward(
            echoReward, 
            otherData.taskURI,
            otherData.crossChainAsset,
            crossChainAmount,
            otherData.targetChainId,
            { 
                value: crossChainAmount // 只支付跨链奖励部分的原生代币
            }
        );
    } else {
        // 纯ECHO模式：只支付ECHO代币
        return await taskEscrow.createTask(echoReward, otherData.taskURI);
    }
};
`;

console.log(frontendLogic);

console.log("\n=== 影响分析 ===");

console.log("\n✅ 不受影响的功能：");
console.log("1. createTask() - 完全不变");
console.log("2. _createTask() - 完全不变");
console.log("3. 所有现有测试 - 都使用createTask()");
console.log("4. 标准任务创建流程 - 不变");
console.log("5. 任务生命周期管理 - 不变");

console.log("\n⚠️ 需要适配的功能：");
console.log("1. 前端原子化操作调用");
console.log("2. 跨链奖励相关的UI提示");
console.log("3. 用户需要准备两种代币的说明");

console.log("\n=== 实施步骤 ===");
console.log("1. 修改TaskEscrow.sol中的createTaskWithCrossChainReward函数");
console.log("2. 更新前端useCreateTask.ts中的原子化操作逻辑");
console.log("3. 添加用户界面提示，说明需要两种代币");
console.log("4. 测试修改后的跨链奖励功能");
console.log("5. 确认现有功能不受影响");

console.log("\n=== 优势 ===");
console.log("✅ 最小化修改 - 只改一个函数");
console.log("✅ 不影响现有功能 - createTask()保持不变");
console.log("✅ 逻辑清晰 - 明确区分两种代币用途");
console.log("✅ 向后兼容 - 现有代码继续工作");