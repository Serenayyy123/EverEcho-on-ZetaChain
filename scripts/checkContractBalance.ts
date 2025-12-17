/**
 * 检查 TaskEscrow 合约的 ECHO 代币余额
 * 诊断 confirmComplete 失败是否由于余额不足
 */

import { ethers } from 'ethers';

async function checkContractBalance() {
  console.log('💰 检查合约余额...\n');

  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const ECHO_TOKEN_ADDRESS = '0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D';
  const TASK_ID = 3;

  // ERC20 ABI
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
  ];

  // TaskEscrow ABI
  const TASK_ESCROW_ABI = [
    'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 创建合约实例
    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ERC20_ABI, provider);
    const taskEscrow = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    // 获取代币信息
    const symbol = await echoToken.symbol();
    const decimals = await echoToken.decimals();
    console.log(`📋 代币信息: ${symbol}, ${decimals} decimals`);

    // 获取合约余额
    const contractBalance = await echoToken.balanceOf(TASK_ESCROW_ADDRESS);
    console.log(`💰 TaskEscrow 合约余额: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);

    // 获取任务信息
    const taskData = await taskEscrow.tasks(TASK_ID);
    const reward = taskData.reward;
    const postFee = taskData.echoPostFee;
    
    console.log(`\n📋 任务 ${TASK_ID} 信息:`);
    console.log(`   - 奖励: ${ethers.formatUnits(reward, decimals)} ${symbol}`);
    console.log(`   - 发布费: ${ethers.formatUnits(postFee, decimals)} ${symbol}`);

    // 计算需要的总金额
    const FEE_BPS = 200; // 2%
    const fee = (reward * BigInt(FEE_BPS)) / BigInt(10000);
    const helperReward = reward - fee;
    const totalHelperPayout = helperReward + reward + postFee; // 0.98R + 保证金R + postFee

    console.log(`\n💸 结算计算:`);
    console.log(`   - 手续费 (2%): ${ethers.formatUnits(fee, decimals)} ${symbol}`);
    console.log(`   - Helper 奖励 (98%): ${ethers.formatUnits(helperReward, decimals)} ${symbol}`);
    console.log(`   - Helper 保证金退回: ${ethers.formatUnits(reward, decimals)} ${symbol}`);
    console.log(`   - 发布费退回: ${ethers.formatUnits(postFee, decimals)} ${symbol}`);
    console.log(`   - Helper 总收款: ${ethers.formatUnits(totalHelperPayout, decimals)} ${symbol}`);
    console.log(`   - 需要销毁: ${ethers.formatUnits(fee, decimals)} ${symbol}`);

    // 检查余额是否充足
    console.log(`\n🔍 余额检查:`);
    console.log(`   - 合约当前余额: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);
    console.log(`   - 需要支付给 Helper: ${ethers.formatUnits(totalHelperPayout, decimals)} ${symbol}`);
    console.log(`   - 余额充足: ${contractBalance >= totalHelperPayout ? '✅' : '❌'}`);

    if (contractBalance < totalHelperPayout) {
      const shortage = totalHelperPayout - contractBalance;
      console.log(`   ❌ 余额不足，缺少: ${ethers.formatUnits(shortage, decimals)} ${symbol}`);
      console.log(`\n💡 解决方案:`);
      console.log(`   1. 向合约地址转入更多 ${symbol} 代币`);
      console.log(`   2. 检查是否有其他任务占用了资金`);
      console.log(`   3. 联系管理员检查合约状态`);
    } else {
      console.log(`   ✅ 余额充足，问题可能在其他地方`);
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkContractBalance().catch(console.error);