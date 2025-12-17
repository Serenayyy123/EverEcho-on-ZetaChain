import fs from 'fs';

console.log('🔍 验证前端配置...');
console.log('');

// 读取前端环境配置
const frontendEnv = fs.readFileSync('frontend/.env', 'utf8');
console.log('📋 前端 .env 文件内容:');
console.log(frontendEnv);
console.log('');

// 检查关键地址
const echoTokenMatch = frontendEnv.match(/VITE_EOCHO_TOKEN_ADDRESS=(.+)/);
const registerMatch = frontendEnv.match(/VITE_REGISTER_ADDRESS=(.+)/);
const taskEscrowMatch = frontendEnv.match(/VITE_TASK_ESCROW_ADDRESS=(.+)/);
const chainIdMatch = frontendEnv.match(/VITE_CHAIN_ID=(.+)/);

console.log('📋 解析的地址:');
console.log('   ECHOToken:', echoTokenMatch ? echoTokenMatch[1] : '未找到');
console.log('   Register:', registerMatch ? registerMatch[1] : '未找到');
console.log('   TaskEscrow:', taskEscrowMatch ? taskEscrowMatch[1] : '未找到');
console.log('   Chain ID:', chainIdMatch ? chainIdMatch[1] : '未找到');
console.log('');

// 验证地址是否正确
const correctAddresses = {
  echoToken: '0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd',
  register: '0xDb8524e8f73Ac074b4e002Ba6035Cf6466c7f025',
  taskEscrow: '0x437Cc2a9fe6aA835d6B8623D853219c8B21A641c',
  chainId: '7001'
};

console.log('✅ 地址验证:');
console.log('   ECHOToken:', echoTokenMatch && echoTokenMatch[1] === correctAddresses.echoToken ? '✅ 正确' : '❌ 错误');
console.log('   Register:', registerMatch && registerMatch[1] === correctAddresses.register ? '✅ 正确' : '❌ 错误');
console.log('   TaskEscrow:', taskEscrowMatch && taskEscrowMatch[1] === correctAddresses.taskEscrow ? '✅ 正确' : '❌ 错误');
console.log('   Chain ID:', chainIdMatch && chainIdMatch[1] === correctAddresses.chainId ? '✅ 正确' : '❌ 错误');
console.log('');

console.log('🌐 前端访问地址: http://localhost:5173');
console.log('🔗 ZetaChain区块浏览器: https://athens.explorer.zetachain.com');
console.log('');
console.log('📱 MetaMask导入ECHO代币:');
console.log('   地址:', correctAddresses.echoToken);
console.log('   符号: ECHO');
console.log('   小数位数: 18');
console.log('   网络: ZetaChain Athens Testnet (Chain ID: 7001)');