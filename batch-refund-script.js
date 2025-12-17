
// 批量退款脚本
// 请替换相应的私钥后在 Node.js 环境中运行

const { ethers } = require('ethers');

const UNIVERSAL_REWARD_ADDRESS = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
const ABI = [
  "function nextRewardId() external view returns (uint256)",
  "function rewardPlans(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function refund(uint256 rewardId) external",
  "event RewardRefunded(uint256 indexed rewardId, address indexed creator)"
];

async function batchRefund() {
  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  
  // 创建者私钥映射 - 请填入实际私钥
  const creatorPrivateKeys = {
    '0x099Fb550F7Dc5842621344c5a1678F943eEF3488': 'PRIVATE_KEY_FOR_0x099Fb550F7Dc5842621344c5a1678F943eEF3488', // 请替换为实际私钥
    '0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db': 'PRIVATE_KEY_FOR_0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db', // 请替换为实际私钥
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': 'PRIVATE_KEY_FOR_0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // 请替换为实际私钥
    '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe': 'PRIVATE_KEY_FOR_0xD68a76259d4100A2622D643d5e62F5F92C28C4fe', // 请替换为实际私钥
  };
  
  // 退款数据
  const refundData = {
    "0x099Fb550F7Dc5842621344c5a1678F943eEF3488": [
        {
            "rewardId": 1,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 2,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.01",
            "status": 4
        },
        {
            "rewardId": 5,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.0001",
            "status": 4
        },
        {
            "rewardId": 6,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.0001",
            "status": 4
        },
        {
            "rewardId": 7,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.0001",
            "status": 4
        },
        {
            "rewardId": 8,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "1.0",
            "status": 4
        },
        {
            "rewardId": 9,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "1.0",
            "status": 4
        },
        {
            "rewardId": 10,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "1.0",
            "status": 4
        },
        {
            "rewardId": 11,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 18,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 20,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 21,
            "creator": "0x099Fb550F7Dc5842621344c5a1678F943eEF3488",
            "amount": "0.001",
            "status": 4
        }
    ],
    "0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db": [
        {
            "rewardId": 3,
            "creator": "0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 4,
            "creator": "0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db",
            "amount": "0.0001",
            "status": 4
        }
    ],
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": [
        {
            "rewardId": 12,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 13,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 14,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 15,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 16,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 17,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        },
        {
            "rewardId": 19,
            "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "amount": "0.001",
            "status": 4
        }
    ],
    "0xD68a76259d4100A2622D643d5e62F5F92C28C4fe": [
        {
            "rewardId": 22,
            "creator": "0xD68a76259d4100A2622D643d5e62F5F92C28C4fe",
            "amount": "0.001",
            "status": 4
        }
    ]
};
  
  for (const [creator, rewards] of Object.entries(refundData)) {
    const privateKey = creatorPrivateKeys[creator];
    if (!privateKey || privateKey.startsWith('PRIVATE_KEY_FOR_')) {
      console.log(`⚠️ 跳过创建者 ${creator}: 未提供私钥`);
      continue;
    }
    
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(UNIVERSAL_REWARD_ADDRESS, ABI, wallet);
      
      console.log(`👤 处理创建者 ${creator} 的 ${rewards.length} 个奖励...`);
      
      for (const reward of rewards) {
        try {
          console.log(`🔄 退款奖励 ${reward.rewardId}...`);
          const tx = await contract.refund(reward.rewardId);
          console.log(`📤 交易发送: ${tx.hash}`);
          
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log(`✅ 奖励 ${reward.rewardId} 退款成功`);
          } else {
            console.log(`❌ 奖励 ${reward.rewardId} 退款失败`);
          }
          
          // 延迟避免 nonce 冲突
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ 奖励 ${reward.rewardId} 退款失败:`, error.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ 处理创建者 ${creator} 失败:`, error.message);
    }
  }
  
  console.log('✅ 批量退款完成');
}

batchRefund().catch(console.error);
