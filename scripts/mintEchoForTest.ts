#!/usr/bin/env tsx

/**
 * 为测试账户铸造ECHO代币
 */

import { ethers } from 'hardhat';

async function mintEchoForTest() {
  console.log('🪙 Minting ECHO tokens for testing...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Account:', deployer.address);

  const echoTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  try {
    // 获取ECHO代币合约
    const echoTokenABI = [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address account) external view returns (uint256)",
      "function owner() external view returns (address)",
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];

    const echoToken = new ethers.Contract(echoTokenAddress, echoTokenABI, deployer);

    // 检查当前余额
    const currentBalance = await echoToken.balanceOf(deployer.address);
    console.log('📋 Current ECHO balance:', ethers.formatEther(currentBalance), 'ECHO');

    // 尝试铸造代币
    const mintAmount = ethers.parseEther('1000'); // 铸造1000 ECHO
    
    try {
      console.log('🔨 Attempting to mint', ethers.formatEther(mintAmount), 'ECHO...');
      const mintTx = await echoToken.mint(deployer.address, mintAmount);
      console.log('📝 Mint transaction sent:', mintTx.hash);
      await mintTx.wait();
      console.log('✅ Mint transaction confirmed');
    } catch (mintError) {
      console.log('⚠️ Mint failed (might not be owner), trying alternative...');
      
      // 如果铸造失败，尝试从其他账户转账
      const [, account1, account2] = await ethers.getSigners();
      
      for (const account of [account1, account2]) {
        try {
          const accountBalance = await echoToken.balanceOf(account.address);
          console.log(`📋 Account ${account.address} balance:`, ethers.formatEther(accountBalance), 'ECHO');
          
          if (accountBalance > ethers.parseEther('500')) {
            console.log(`💸 Transferring from ${account.address}...`);
            const echoTokenWithAccount = echoToken.connect(account);
            const transferTx = await echoTokenWithAccount.transfer(deployer.address, ethers.parseEther('500'));
            console.log('📝 Transfer transaction sent:', transferTx.hash);
            await transferTx.wait();
            console.log('✅ Transfer completed');
            break;
          }
        } catch (err) {
          console.log(`⚠️ Could not transfer from ${account.address}`);
        }
      }
    }

    // 检查最终余额
    const finalBalance = await echoToken.balanceOf(deployer.address);
    console.log('📋 Final ECHO balance:', ethers.formatEther(finalBalance), 'ECHO');

    if (finalBalance >= ethers.parseEther('110')) {
      console.log('✅ Sufficient ECHO balance for testing!');
      return true;
    } else {
      console.log('❌ Still insufficient ECHO balance');
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to mint ECHO:', error);
    return false;
  }
}

if (require.main === module) {
  mintEchoForTest()
    .then((success) => {
      if (success) {
        console.log('🎉 ECHO minting completed successfully!');
      } else {
        console.log('❌ ECHO minting failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { mintEchoForTest };