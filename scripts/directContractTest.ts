import { ethers } from "hardhat";

async function main() {
  console.log("🔍 直接合约测试");
  console.log("=====================================");
  
  // 直接使用部署的地址
  const echoTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log(`📋 测试地址: ${echoTokenAddress}`);
  
  // 获取网络信息
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  
  console.log(`🌐 网络: ${network.name} (ChainId: ${network.chainId})`);
  console.log(`📊 区块高度: ${blockNumber}`);
  
  // 检查地址是否有代码
  const code = await provider.getCode(echoTokenAddress);
  console.log(`💻 合约代码长度: ${code.length} 字符`);
  console.log(`💻 合约代码: ${code.substring(0, 50)}...`);
  
  if (code === '0x') {
    console.log("❌ 合约地址没有代码！");
    return;
  }
  
  try {
    // 尝试直接调用
    const echoToken = await ethers.getContractAt("EOCHOToken", echoTokenAddress);
    console.log("✅ 合约连接成功");
    
    const totalSupply = await echoToken.totalSupply();
    console.log(`✅ 总供应量: ${ethers.formatEther(totalSupply)} ECHO`);
    
  } catch (error) {
    console.log(`❌ 合约调用失败: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});