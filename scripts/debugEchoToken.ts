#!/usr/bin/env tsx

/**
 * 调试ECHO代币合约
 */

import { ethers } from 'hardhat';

async function debugEchoToken() {
  console.log('🔍 Debugging ECHO Token Contract...');

  const [deployer, account1, account2] = await ethers.getSigners();
  const echoTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  try {
    // 获取ECHO代币合约
    const echoTokenABI = [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address account) external view returns (uint256)",
      "function owner() external view returns (address)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function totalSupply() external view returns (uint256)"
    ];

    const echoToken = new ethers.Contract(echoTokenAddress, echoTokenABI, deployer);

    // 基本信息
    console.log('📋 Token Info:');
    try {
      const name = await echoToken.name();
      const symbol = await echoToken.symbol();
      const totalSupply = await echoToken.totalSupply();
      console.log('  Name:', name);
      console.log('  Symbol:', symbol);
      console.log('  Total Supply:', ethers.formatEther(totalSupply), symbol);
    } catch (err) {
      console.log('  Could not get token info:', err.message);
    }

    // 检查所有账户余额
    console.log('\n💰 Account Balances:');
    const accounts = [deployer, account1, account2];
    for (let i = 0; i < accounts.length; i++) {
      const balance = await echoToken.balanceOf(accounts[i].address);
      console.log(`  Account ${i} (${accounts[i].address}): ${ethers.formatEther(balance)} ECHO`);
    }

    // 检查owner
    try {
      const owner = await echoToken.owner();
      console.log('\n👑 Contract Owner:', owner);
      
      // 如果deployer是owner，尝试铸造
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log('✅ Deployer is owner, attempting to mint...');
        const mintTx = await echoToken.mint(deployer.address, ethers.parseEther('1000'));
        await mintTx.wait();
        console.log('✅ Minted 1000 ECHO to deployer');
        
        const newBalance = await echoToken.balanceOf(deployer.address);
        console.log('📋 New deployer balance:', ethers.formatEther(newBalance), 'ECHO');
      } else {
        console.log('⚠️ Deployer is not owner');
        
        // 尝试从account1转账（它有最多的ECHO）
        console.log('💸 Attempting transfer from account1...');
        const echoTokenWithAccount1 = echoToken.connect(account1);
        
        try {
          const transferAmount = ethers.parseEther('50');
          const transferTx = await echoTokenWithAccount1.transfer(deployer.address, transferAmount);
          await transferTx.wait();
          console.log('✅ Transferred 50 ECHO from account1 to deployer');
          
          const newBalance = await echoToken.balanceOf(deployer.address);
          console.log('📋 New deployer balance:', ethers.formatEther(newBalance), 'ECHO');
        } catch (transferErr) {
          console.log('❌ Transfer failed:', transferErr.message);
        }
      }
    } catch (err) {
      console.log('⚠️ Could not check owner:', err.message);
    }

    return true;

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return false;
  }
}

if (require.main === module) {
  debugEchoToken()
    .then(() => {
      console.log('🎉 Debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { debugEchoToken };