// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UniversalRewardInterface
 * @notice Method 4实现需要的UniversalReward接口
 * @dev 为TaskEscrow的原子化操作提供跨链奖励功能
 */
contract UniversalRewardInterface {
    
    struct CrossChainReward {
        uint256 rewardId;
        address creator;
        address crossChainAsset;
        uint256 crossChainAmount;
        uint256 targetChainId;
        uint256 taskId;
        bool isLocked;
        uint256 createdAt;
    }
    
    uint256 public rewardCounter;
    mapping(uint256 => CrossChainReward) public rewards;
    
    event CrossChainRewardCreated(
        uint256 indexed rewardId,
        address indexed creator,
        address crossChainAsset,
        uint256 crossChainAmount,
        uint256 targetChainId,
        uint256 indexed taskId
    );
    
    /**
     * @notice 为TaskEscrow创建并锁定跨链奖励（原子化操作）
     * @param creator 奖励创建者
     * @param crossChainAsset 跨链资产地址
     * @param crossChainAmount 跨链奖励数量
     * @param targetChainId 目标链ID
     * @param taskId 关联的任务ID
     * @return rewardId 跨链奖励ID
     */
    function createAndLockReward(
        address creator,
        address crossChainAsset,
        uint256 crossChainAmount,
        uint256 targetChainId,
        uint256 taskId
    ) external payable returns (uint256 rewardId) {
        // 验证调用者（应该是TaskEscrow合约）
        // 在实际部署中，这里应该有适当的权限控制
        
        // 验证支付金额
        require(msg.value >= crossChainAmount, "Insufficient payment");
        
        // 生成奖励ID
        rewardCounter++;
        rewardId = rewardCounter;
        
        // 创建跨链奖励记录
        rewards[rewardId] = CrossChainReward({
            rewardId: rewardId,
            creator: creator,
            crossChainAsset: crossChainAsset,
            crossChainAmount: crossChainAmount,
            targetChainId: targetChainId,
            taskId: taskId,
            isLocked: true, // 直接锁定到任务
            createdAt: block.timestamp
        });
        
        emit CrossChainRewardCreated(
            rewardId,
            creator,
            crossChainAsset,
            crossChainAmount,
            targetChainId,
            taskId
        );
        
        return rewardId;
    }
    
    /**
     * @notice 获取跨链奖励信息
     * @param rewardId 奖励ID
     * @return reward 跨链奖励信息
     */
    function getReward(uint256 rewardId) external view returns (CrossChainReward memory) {
        return rewards[rewardId];
    }
    
    /**
     * @notice 检查奖励是否锁定到任务
     * @param rewardId 奖励ID
     * @param taskId 任务ID
     * @return isLocked 是否锁定
     */
    function isRewardLockedToTask(uint256 rewardId, uint256 taskId) external view returns (bool) {
        CrossChainReward memory reward = rewards[rewardId];
        return reward.isLocked && reward.taskId == taskId;
    }
    
    /**
     * @notice 释放跨链奖励（任务完成时调用）
     * @param rewardId 奖励ID
     * @param recipient 接收者地址
     */
    function releaseReward(uint256 rewardId, address recipient) external {
        CrossChainReward storage reward = rewards[rewardId];
        require(reward.isLocked, "Reward not locked");
        require(reward.crossChainAmount > 0, "Invalid reward");
        
        // 在实际实现中，这里应该有权限检查（只有TaskEscrow可以调用）
        
        // 释放资金
        uint256 amount = reward.crossChainAmount;
        reward.crossChainAmount = 0;
        reward.isLocked = false;
        
        // 转账给接收者
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice 退还跨链奖励（任务取消时调用）
     * @param rewardId 奖励ID
     */
    function refundReward(uint256 rewardId) external {
        CrossChainReward storage reward = rewards[rewardId];
        require(reward.isLocked, "Reward not locked");
        require(reward.crossChainAmount > 0, "Invalid reward");
        
        // 在实际实现中，这里应该有权限检查（只有TaskEscrow可以调用）
        
        // 退还给创建者
        uint256 amount = reward.crossChainAmount;
        address creator = reward.creator;
        reward.crossChainAmount = 0;
        reward.isLocked = false;
        
        // 转账给创建者
        (bool success, ) = creator.call{value: amount}("");
        require(success, "Refund failed");
    }
}