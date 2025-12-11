# Base Sepolia 部署快速参考

## 🚀 快速部署（5 分钟版）

### 1. 准备环境
```bash
# 获取测试 ETH
# https://www.alchemy.com/faucets/base-sepolia

# 配置 .env
cp .env.example .env
# 填入: BASE_SEPOLIA_RPC_URL, PRIVATE_KEY
```

### 2. 部署合约
```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### 3. 配置前端
```bash
cd frontend
cp .env.example .env
# 填入: VITE_CHAIN_ID=84532, 三个合约地址
```

### 4. 配置后端
```bash
cd backend
cp .env.example .env
# 填入: RPC_URL, TASK_ESCROW_ADDRESS, CHAIN_ID=84532
```

### 5. 启动服务
```bash
# 终端 1
cd backend && npm run dev

# 终端 2
cd frontend && npm run dev
```

### 6. 配置 MetaMask
- 网络名称: Base Sepolia
- RPC: https://sepolia.base.org
- 链 ID: 84532
- 浏览器: https://sepolia.basescan.org

---

## 📋 关键信息

### Base Sepolia
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.alchemy.com/faucets/base-sepolia

### 合约地址（部署后填入）
```
EOCHOToken:  ________________
Register:    ________________
TaskEscrow:  ________________
```

---

## 🔧 常见命令

### 编译合约
```bash
npx hardhat compile
```

### 部署合约
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### 验证合约
```bash
npx hardhat verify --network baseSepolia <地址> [构造函数参数]
```

### 查看部署信息
```bash
cat deployment.json
```

### 启动后端
```bash
cd backend && npm run dev
```

### 启动前端
```bash
cd frontend && npm run dev
```

---

## ⚠️ 常见问题

### Q: 部署失败 "insufficient funds"
**A**: 从 Faucet 获取更多测试 ETH

### Q: 前端显示 "Wrong Network"
**A**: MetaMask 切换到 Base Sepolia

### Q: 后端无法连接 RPC
**A**: 检查 backend/.env 中的 RPC_URL

### Q: 余额显示 0 ECHO
**A**: 
1. 检查注册交易是否成功
2. 刷新页面
3. 检查合约地址配置

---

## 📝 验收清单

- [ ] 合约部署成功（3 个）
- [ ] Token name/symbol 为 ECHO
- [ ] 前端可以连接钱包
- [ ] 后端可以读取链上数据
- [ ] 注册功能正常
- [ ] 任务流程正常

---

## 🔗 相关文档

- **完整 Playbook**: `docs/BASE_SEPOLIA_DEPLOYMENT_PLAYBOOK.md`
- **回归测试**: `docs/STEP2_REGRESSION_REPORT.md`
- **冻结点检查**: `docs/STEP2_FREEZE_POINT_CHECKLIST.md`

---

**快速参考版本**: v1.0  
**最后更新**: 2025-11-25
