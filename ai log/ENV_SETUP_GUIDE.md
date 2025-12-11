# 环境变量配置指南

**目标**: 配置 EverEcho 在 Sepolia 测试网运行所需的环境变量

---

## ✅ 已完成的配置

我已经为你创建了三个配置文件：
- ✅ `.env` - 根目录配置（用于合约部署）
- ✅ `frontend/.env` - 前端配置
- ✅ `backend/.env` - 后端配置

---

## 📝 需要你手动填写的内容

### 步骤 1: 获取 MetaMask 私钥

1. 打开 MetaMask 浏览器插件
2. 点击右上角的三个点 `⋮`
3. 选择 "账户详情"
4. 点击 "导出私钥"
5. 输入 MetaMask 密码
6. 复制私钥（以 `0x` 开头的 64 位字符串）

⚠️ **安全提示**:
- 私钥非常重要，不要泄露给任何人
- 建议使用专门的测试账户，不要使用存有真实资产的账户
- 不要将 `.env` 文件提交到 Git

### 步骤 2: 填写私钥到根目录 `.env`

打开 `.env` 文件，找到这一行：
```env
PRIVATE_KEY=YOUR_METAMASK_PRIVATE_KEY_HERE
```

替换为你的实际私钥：
```env
PRIVATE_KEY=0x1234567890abcdef...（你的私钥）
```

### 步骤 3: 获取 Sepolia 测试 ETH

1. 访问水龙头：https://sepoliafaucet.com/
2. 粘贴你的钱包地址（从 MetaMask 复制）
3. 完成验证（可能需要 Alchemy 账号）
4. 等待接收 0.5 ETH（约 1-5 分钟）

**其他水龙头**（如果第一个不工作）:
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia
- https://sepolia-faucet.pk910.de/

---

## 🚀 部署合约并更新配置

### 步骤 4: 部署合约到 Sepolia

在项目根目录运行：

```cmd
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

**预期输出**:
```
==================================================
EverEcho 合约部署到 Sepolia
==================================================

部署账户: 0x1234...5678
账户余额: 0.5 ETH

[1/3] 部署 EOCHOToken...
✓ EOCHOToken 部署成功: 0xABCD...1234

[2/3] 部署 Register...
✓ Register 部署成功: 0xEFGH...5678

[3/3] 部署 TaskEscrow...
✓ TaskEscrow 部署成功: 0xIJKL...9012

==================================================
部署完成！
==================================================
```

⚠️ **重要**: 保存这三个合约地址！

### 步骤 5: 更新前端配置

打开 `frontend/.env`，填入合约地址：

```env
VITE_EOCHO_TOKEN_ADDRESS=0xABCD...1234
VITE_REGISTER_ADDRESS=0xEFGH...5678
VITE_TASK_ESCROW_ADDRESS=0xIJKL...9012
```

### 步骤 6: 更新后端配置

打开 `backend/.env`，填入 TaskEscrow 合约地址：

```env
TASK_ESCROW_ADDRESS=0xIJKL...9012
```

---

## ✅ 配置完成检查清单

- [ ] 已获取 MetaMask 私钥
- [ ] 已填写私钥到 `.env`
- [ ] 已获取 Sepolia 测试 ETH（至少 0.3 ETH）
- [ ] 已编译合约（`npx hardhat compile`）
- [ ] 已部署合约到 Sepolia
- [ ] 已保存三个合约地址
- [ ] 已更新 `frontend/.env` 的合约地址
- [ ] 已更新 `backend/.env` 的合约地址

---

## 🎯 下一步：启动服务

配置完成后，运行：

```cmd
# 安装依赖（如果还没装）
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 启动服务
.\start-dev.ps1
```

或手动启动：

**终端 1 - 后端**:
```cmd
cd backend
npx prisma migrate dev
npx prisma generate
npm run dev
```

**终端 2 - 前端**:
```cmd
cd frontend
npm run dev
```

---

## 🔍 验证配置

### 检查后端
访问：http://localhost:3001/healthz

应该看到：
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "rpc": "ok"
  }
}
```

### 检查前端
访问：http://localhost:5173

应该看到 EverEcho 首页

---

## ❓ 常见问题

### Q1: 私钥格式错误

**错误**: `invalid private key`

**解决**: 
- 确保私钥以 `0x` 开头
- 确保私钥是 66 个字符（0x + 64 位十六进制）
- 不要有空格或换行

### Q2: 余额不足

**错误**: `insufficient funds for intrinsic transaction cost`

**解决**:
- 确认账户有至少 0.3 ETH
- 从水龙头获取更多 ETH
- 等待几分钟后重试

### Q3: RPC 连接失败

**错误**: `could not detect network`

**解决**:
- 检查网络连接
- 尝试使用 Alchemy RPC（需要注册）
- 等待几分钟后重试

### Q4: 合约地址未填写

**错误**: 前端显示 "Wrong network" 或无法连接

**解决**:
- 确认已部署合约
- 确认已更新 `frontend/.env` 和 `backend/.env`
- 重启前端和后端服务

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 `docs/A4_DEPLOYMENT.md` 的故障排除部分
2. 查看 `docs/QUICK_START.md` 的常见问题
3. 检查后端日志和浏览器控制台

---

**配置完成后，你就可以开始真人测试了！** 🎉

参考 `docs/A4_BETA_GUIDE.md` 进行完整的试用流程。
