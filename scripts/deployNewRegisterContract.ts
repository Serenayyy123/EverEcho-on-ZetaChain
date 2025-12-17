/**
 * 重新部署Register合约使用正确的ECHO Token地址
 */

import { ethers } from 'ethers';

const CORRECT_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';
const OLD_REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';

// Register合约字节码和ABI
const REGISTER_BYTECODE = "0x608060405234801561001057600080fd5b5060405161084738038061084783398101604081905261002f91610054565b6001600160a01b03811661004557600080fd5b6001600160a01b0316608052610084565b60006020828403121561006657600080fd5b81516001600160a01b038116811461007d57600080fd5b9392505050565b6080516107a56100a26000396000818161014c015261024001526107a56000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631aa3a0081461005c578063396f650114610071578063c3c5a5471461009e578063d393c871146100c1578063f6326fb3146100e1575b600080fd5b61006f61006a366004610520565b6100f4565b005b61008461007f3660046105a2565b610247565b604051901515815260200160405180910390f35b6100b16100ac3660046105a2565b610262565b60405190151581526020015b60405180910390f35b6100d46100cf3660046105a2565b6102fc565b6040516100b891906105c4565b6100e961039e565b6040516100b891906105c4565b6001600160a01b03811660009081526001602052604090205460ff16156101335760405163025d89c360e61b815260040160405180910390fd5b8051600003610155576040516309bde33960e01b815260040160405180910390fd5b6040516370a0823160e01b81523360048201526000907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa1580156101bd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101e19190610617565b60405163a1b295bb60e01b8152336004820152909150610000906001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169063a1b295bb90602401600060405180830381600087803b15801561024a57600080fd5b505af115801561025e573d6000803e3d6000fd5b5050604051637f5e9f2060e01b81523360048201526000925060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031691507f5e9f20906024016020604051808303816000875af11580156102ce573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102f29190610617565b6102fc9190610630565b336000818152600160208190526040808320805460ff19169092179091556002825291829020855161033092870190610431565b50604080518281526020810184905233917f4d3754632451ebba9812a9305e7bca17b67a17186a5cff93d2e9ae1b01e3d27b910160405180910390a25050565b60606040518060400160405280600a81526020016945434820546f6b656e60b01b81525090565b8280546103dd90610643565b90600052602060002090601f0160209004810192826103ff5760008555610445565b82601f1061041857805160ff1916838001178555610445565b82800160010185558215610445579182015b8281111561044557825182559160200191906001019061042a565b50610451929150610455565b5090565b5b808211156104515760008155600101610456565b634e487b7160e01b600052604160045260246000fd5b600067ffffffffffffffff8084111561049b5761049b61046a565b604051601f8501601f19908116603f011681019082821181831017156104c3576104c361046a565b816040528093508581528686860111156104dc57600080fd5b858560208301376000602087830101525050509392505050565b600082601f83011261050757600080fd5b61051683833560208501610480565b9392505050565b60006020828403121561052f57600080fd5b813567ffffffffffffffff81111561054657600080fd5b610552848285016104f6565b949350505050565b80356001600160a01b038116811461057157600080fd5b919050565b600082601f83011261058757600080fd5b61051683833560208501610480565b6000602082840312156105a857600080fd5b6105168261055a565b600060208083528351808285015260005b818110156105f1578581018301518582016040015282016105d5565b81811115610603576000604083870101525b50601f01601f1916929092016040019392505050565b60006020828403121561062957600080fd5b5051919050565b60008282101561065057634e487b7160e01b600052601160045260246000fd5b500390565b600181811c9082168061066757607f821691505b6020821081141561068857634e487b7160e01b600052602260045260246000fd5b5091905056fea2646970667358221220c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f564736f6c634300080c0033";

const REGISTER_ABI = [
  "constructor(address _echoToken)",
  "function echoToken() view returns (address)",
  "function isRegistered(address user) view returns (bool)",
  "function profileURI(address user) view returns (string)",
  "function register(string calldata _profileURI) external",
  "event UserRegistered(address indexed user, string profileURI, uint256 mintedAmount)"
];

async function deployNewRegisterContract() {
  console.log('🚀 重新部署Register合约...\n');

  console.log(`📋 使用ECHO Token地址: ${CORRECT_ECHO_TOKEN}`);
  console.log(`📋 旧Register合约地址: ${OLD_REGISTER_ADDRESS}\n`);

  try {
    // 连接到ZetaChain
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 获取私钥
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.ZETA_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('未找到DEPLOYER_PRIVATE_KEY或ZETA_PRIVATE_KEY环境变量');
    }

    // 创建钱包
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey, provider);
    console.log(`👤 部署者地址: ${wallet.address}`);

    // 检查余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 账户余额: ${ethers.formatEther(balance)} ZETA`);

    if (balance < ethers.parseEther('0.01')) {
      throw new Error('账户余额不足，需要至少0.01 ZETA用于部署');
    }

    // 1. 验证ECHO Token地址
    console.log('\n1. 📡 验证ECHO Token合约...');
    const echoTokenContract = new ethers.Contract(CORRECT_ECHO_TOKEN, [
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ], provider);

    try {
      const name = await echoTokenContract.name();
      const symbol = await echoTokenContract.symbol();
      console.log(`   ✅ ECHO Token验证成功: ${name} (${symbol})`);
    } catch (error) {
      throw new Error(`ECHO Token合约验证失败: ${error}`);
    }

    // 2. 部署新的Register合约
    console.log('\n2. 🚀 部署新的Register合约...');
    
    // 创建合约工厂
    const RegisterFactory = new ethers.ContractFactory(REGISTER_ABI, REGISTER_BYTECODE, wallet);
    
    // 估算gas
    console.log('   📊 估算部署gas费用...');
    const deploymentData = RegisterFactory.interface.encodeDeploy([CORRECT_ECHO_TOKEN]);
    const gasEstimate = await provider.estimateGas({
      data: REGISTER_BYTECODE + deploymentData.slice(2)
    });
    console.log(`   预估gas: ${gasEstimate.toString()}`);

    // 部署合约
    console.log('   📤 发送部署交易...');
    const registerContract = await RegisterFactory.deploy(CORRECT_ECHO_TOKEN, {
      gasLimit: gasEstimate * 120n / 100n // 增加20%的gas缓冲
    });

    console.log(`   交易哈希: ${registerContract.deploymentTransaction()?.hash}`);
    console.log('   ⏳ 等待部署确认...');

    // 等待部署完成
    await registerContract.waitForDeployment();
    const newRegisterAddress = await registerContract.getAddress();
    
    console.log(`   ✅ Register合约部署成功!`);
    console.log(`   📍 新合约地址: ${newRegisterAddress}`);

    // 3. 验证部署结果
    console.log('\n3. ✅ 验证部署结果...');
    const deployedEchoToken = await registerContract.echoToken();
    console.log(`   Register.echoToken(): ${deployedEchoToken}`);
    
    if (deployedEchoToken.toLowerCase() === CORRECT_ECHO_TOKEN.toLowerCase()) {
      console.log('   ✅ ECHO Token地址配置正确!');
    } else {
      console.log('   ❌ ECHO Token地址配置错误!');
    }

    // 4. 生成配置更新指令
    console.log('\n4. 📝 配置更新指令...');
    console.log('需要更新以下配置文件中的Register合约地址:');
    console.log('');
    console.log('frontend/src/contracts/addresses.ts:');
    console.log(`register: '${newRegisterAddress}',`);
    console.log('');
    console.log('backend/.env:');
    console.log(`REGISTER_CONTRACT_ADDRESS=${newRegisterAddress}`);
    console.log('');
    console.log('其他可能需要更新的文件:');
    console.log('- frontend/src/config/contracts.ts');
    console.log('- 任何硬编码Register地址的脚本文件');

    // 5. 数据迁移提醒
    console.log('\n5. 📋 数据迁移提醒...');
    console.log('⚠️  重要: 新Register合约是空的，需要考虑以下事项:');
    console.log('1. 现有用户的注册状态将丢失');
    console.log('2. 现有用户的profileURI将丢失');
    console.log('3. 可能需要创建数据迁移脚本');
    console.log('4. 或者通知用户重新注册');

    return {
      oldRegisterAddress: OLD_REGISTER_ADDRESS,
      newRegisterAddress,
      echoTokenAddress: CORRECT_ECHO_TOKEN,
      deploymentHash: registerContract.deploymentTransaction()?.hash
    };

  } catch (error: any) {
    console.error('❌ 部署失败:', error.message);
    throw error;
  }
}

// 运行部署
if (require.main === module) {
  deployNewRegisterContract().catch(console.error);
}

export { deployNewRegisterContract };