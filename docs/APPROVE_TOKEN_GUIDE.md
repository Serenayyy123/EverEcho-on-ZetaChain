# 如何授权 ECHO Token

## 问题
创建任务时出现 "missing revert data" 错误，通常是因为 **TaskEscrow 合约的授权额度不足**。

## 原因
创建任务需要 **2x reward** 的 ECHO：
- 1x 作为奖励
- 1x 作为 Creator 的押金

例如：创建 20 ECHO 的任务需要 40 ECHO 的授权。

## 解决方案

### 方法 1：通过前端授权（推荐）

1. 打开浏览器控制台（F12）
2. 粘贴以下代码并回车：

\`\`\`javascript
// 授权 1000 ECHO 给 TaskEscrow
const tokenAddress = '0xe7940e81dDf4d6415f2947829938f9A24B0ad35d';
const escrowAddress = '0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28';
const amount = ethers.parseEther('1000'); // 授权 1000 ECHO

const tokenABI = ['function approve(address spender, uint256 amount) returns (bool)'];
const signer = await window.ethereum.request({ method: 'eth_requestAccounts' });
const provider = new ethers.BrowserProvider(window.ethereum);
const signerObj = await provider.getSigner();
const token = new ethers.Contract(tokenAddress, tokenABI, signerObj);

const tx = await token.approve(escrowAddress, amount);
console.log('Transaction sent:', tx.hash);
await tx.wait();
console.log('✅ Approved 1000 ECHO');
\`\`\`

### 方法 2：通过 Hardhat 脚本

\`\`\`powershell
# 在项目根目录运行
npx hardhat run scripts/approve-token.ts --network baseSepolia
\`\`\`

### 方法 3：通过 Basescan

1. 访问 Token 合约：https://sepolia.basescan.org/address/0xe7940e81dDf4d6415f2947829938f9A24B0ad35d#writeContract
2. 点击 "Connect to Web3"
3. 找到 `approve` 函数
4. 填入：
   - spender: `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28`
   - amount: `1000000000000000000000` (1000 ECHO)
5. 点击 "Write" 并确认交易

## 验证授权

运行以下命令检查授权额度：

\`\`\`powershell
cd backend
npx ts-node scripts/check-balance.ts
\`\`\`

应该看到：
\`\`\`
Allowance: 1000.0 ECHO
\`\`\`

## 常见问题

**Q: 为什么需要 2x reward？**  
A: 双向抵押机制，Creator 和 Helper 都需要押金，防止恶意行为。

**Q: 授权是否安全？**  
A: 授权只允许合约转移你的 token，不会自动转移。只有在你主动创建/接受任务时才会转移。

**Q: 可以授权更多吗？**  
A: 可以，建议授权 1000 ECHO 以避免频繁授权。
