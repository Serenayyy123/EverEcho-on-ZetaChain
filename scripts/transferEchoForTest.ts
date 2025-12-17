#!/usr/bin/env tsx

/**
 * 从有余额的账户转账ECHO给测试账户
 */

import { ethers } from 'hardhat';

async function transferEchoForTest() {
  console.log('💸 Transferring ECHO for testing...');

  const [deployer, account1, account2] = await ethers.getSigners();
  const echoTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  try {
    const echoTokenABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];

    const echoToken = new ethers.Contract(echoTokenAddress, echoTokenABI, deployer);

    // 检查当前余额
    console.log('📋 Current balances:');
    const deployerBalance = await echoToken.balanceOf(deployer.address);
    const account1Balance = await echoToken.balanceOf(account1.address);
    const account2Balance = await echoToken.balanceOf(account2.address);
    
    console.log('  Deployer:', ethers.formatEther(deployerBalance), 'ECHO');
    console.log('  Account1:', ethers.formatEther(account1Balance), 'ECHO');
    console.log('  Account2:', ethers.formatEther(account2Balance), 'ECHO');

    // 从account2转账（它有最多的ECHO）
    if (account2Balance >= ethers.parseEther('150')) {
      console.log('💸 Transferring 150 ECHO from account2 to deployer...');
      
      const echoTokenWithAccount2 = echoToken.connect(account2);
      const transferTx = await echoTokenWithAccount2.transfer(deployer.address, ethers.parseEther('150'));
      console.log('📝 Transfer transaction sent:', transferTx.hash);
      await transferTx.wait();
      console.log('✅ Transfer completed');
      
      // 检查新余额
      const newDeployerBalance = await echoToken.balanceOf(deployer.address);
      console.log('📋 New deployer balance:', ethers.formatEther(newDeployerBalance), 'ECHO');
      
      if (newDeployerBalance >= ethers.parseEther('110')) {
        console.log('✅ Sufficient ECHO balance for testing!');
        return true;
      }
    }

    // 如果account2不够，尝试从account1转账
    if (account1Balance >= ethers.parseEther('50')) {
      console.log('💸 Also transferring from account1...');
      
      const echoTokenWithAccount1 = echoToken.connect(account1);
      const transferTx = await echoTokenWithAccount1.transfer(deployer.address, ethers.parseEther('50'));
      console.log('📝 Transfer transaction sent:', transferTx.hash);
      await transferTx.wait();
      console.log('✅ Transfer completed');
    }

    // 最终检查
    const finalBalance = await echoToken.balanceOf(deployer.address);
    console.log('📋 Final deployer balance:', ethers.formatEther(finalBalance), 'ECHO');

    return finalBalance >= ethers.parseEther('110');

  } catch (error) {
    console.error('❌ Transfer failed:', error);
    return false;
  }
}

if (require.main === module) {
  transferEchoForTest()
    .then((success) => {
      if (success) {
        console.log('🎉 ECHO transfer completed successfully!');
      } else {
        console.log('❌ ECHO transfer failed or insufficient balance');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { transferEchoForTest };