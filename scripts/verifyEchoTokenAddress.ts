import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ZetaChain Athens Testnet配置
const ZETA_TESTNET_CONFIG = {
  chainId: 7001,
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  blockExplorer: 'https://athens.explorer.zetachain.com'
};

async function verifyEchoTokenAddress() {
  console.log('🔍 验证ZetaChain上的ECHOToken地址...');
  console.log('');

  try {
    // 连接到ZetaChain测试网
    const provider = new ethers.JsonRpcProvider(ZETA_TESTNET_CONFIG.rpcUrl);
    
    // 你提到的地址
    const userProvidedAddress = '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A';
    // 配置文件中的地址
    const configAddress = '0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd';
    
    console.log('📋 地址对比:');
    console.log('   你提供的地址:', userProvidedAddress);
    console.log('   配置文件地址:', configAddress);
    console.log('');
    
    // ERC20 ABI用于检查代币信息
    const erc20ABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)'
    ];
    
    // 检查你提供的地址
    console.log('🔍 检查你提供的地址...');
    try {
      const userContract = new ethers.Contract(userProvidedAddress, erc20ABI, provider);
      const userName = await userContract.name();
      const userSymbol = await userContract.symbol();
      const userDecimals = await userContract.decimals();
      const userTotalSupply = await userContract.totalSupply();
      
      console.log('✅ 地址有效:', userProvidedAddress);
      console.log('   代币名称:', userName);
      console.log('   代币符号:', userSymbol);
      console.log('   小数位数:', userDecimals.toString());
      console.log('   总供应量:', ethers.formatEther(userTotalSupply), userSymbol);
      console.log('');
    } catch (error) {
      console.log('❌ 地址无效或不是ERC20代币:', userProvidedAddress);
      console.log('   错误:', error);
      console.log('');
    }
    
    // 检查配置文件中的地址
    console.log('🔍 检查配置文件中的地址...');
    try {
      const configContract = new ethers.Contract(configAddress, erc20ABI, provider);
      const configName = await configContract.name();
      const configSymbol = await configContract.symbol();
      const configDecimals = await configContract.decimals();
      const configTotalSupply = await configContract.totalSupply();
      
      console.log('✅ 地址有效:', configAddress);
      console.log('   代币名称:', configName);
      console.log('   代币符号:', configSymbol);
      console.log('   小数位数:', configDecimals.toString());
      console.log('   总供应量:', ethers.formatEther(configTotalSupply), configSymbol);
      console.log('');
    } catch (error) {
      console.log('❌ 地址无效或不是ERC20代币:', configAddress);
      console.log('   错误:', error);
      console.log('');
    }
    
    // MetaMask导入指南
    console.log('📱 MetaMask导入ECHO代币指南:');
    console.log('');
    console.log('1. 确保MetaMask连接到ZetaChain Athens测试网');
    console.log('   - 网络名称: ZetaChain Athens Testnet');
    console.log('   - RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    console.log('   - Chain ID: 7001');
    console.log('   - 货币符号: ZETA');
    console.log('');
    console.log('2. 导入自定义代币:');
    console.log('   - 点击MetaMask中的"导入代币"');
    console.log('   - 选择"自定义代币"');
    console.log('   - 输入代币合约地址:', userProvidedAddress);
    console.log('   - 代币符号应该自动填入为"ECHO"');
    console.log('   - 小数位数应该自动填入为"18"');
    console.log('   - 点击"添加自定义代币"');
    console.log('');
    console.log('3. 如果导入失败，可能的原因:');
    console.log('   - MetaMask没有连接到ZetaChain网络');
    console.log('   - 代币地址输入错误');
    console.log('   - 网络连接问题');
    console.log('');
    console.log('🔗 区块浏览器链接:');
    console.log('   你的地址:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${userProvidedAddress}`);
    console.log('   配置地址:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${configAddress}`);
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

verifyEchoTokenAddress().catch(console.error);