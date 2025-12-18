# ZetaChain测试网部署指南

## 🚀 准备工作

### 1. 获取测试代币
1. 访问 [ZetaChain水龙头](https://labs.zetachain.com/get-zeta)
2. 连接你的MetaMask钱包
3. 获取测试ZETA代币（用于gas费）

### 2. 设置私钥
1. 创建 `.env` 文件（如果不存在）
2. 添加你的私钥：
```bash
ZETA_PRIVATE_KEY=你的私钥（不要包含0x前缀）
```

⚠️ **安全提醒**: 
- 只使用测试账号的私钥
- 不要在生产环境中使用相同的私钥
- 不要将私钥提交到代码仓库

## 📦 部署步骤

### 1. 编译合约
```bash
npm run compile:all
```

### 2. 部署到ZetaChain测试网
```bash
npm run deploy:zeta
```

部署脚本将会：
- ✅ 部署所有Method 4合约
- ✅ 配置合约之间的关联
- ✅ 更新前端地址配置
- ✅ 生成环境变量文件

### 3. 启动ZetaChain模式
```bash
npm run start:zeta
```

这将启动：
- 🔧 后端服务（连接到ZetaChain）
- 🔧 前端服务（配置为ZetaChain网络）

## 🔧 MetaMask配置

### 添加ZetaChain Athens测试网
1. 打开MetaMask
2. 点击网络下拉菜单
3. 选择"添加网络"
4. 填入以下信息：

| 字段 | 值 |
|------|-----|
| 网络名称 | ZetaChain Athens Testnet |
| RPC URL | https://zetachain-athens-evm.blockpi.network/v1/rpc/public |
| Chain ID | 7001 |
| 货币符号 | ZETA |
| 区块浏览器 | https://athens.explorer.zetachain.com |

## 🎯 测试场景

### 1. 基本功能测试
- ✅ 用户注册
- ✅ 任务发布
- ✅ 任务接受
- ✅ 任务完成

### 2. Method 4原子操作测试
- ✅ 验证TaskID确定性生成
- ✅ 验证单交易原子操作
- ✅ 验证无孤儿奖励问题

### 3. 跨链奖励测试
- ✅ 测试跨链奖励设置
- ✅ 验证奖励正确关联
- ✅ 测试奖励分发

## 📋 合约地址

部署完成后，合约地址将显示在控制台中，并自动更新到：
- `frontend/src/contracts/addresses.ts`
- `.env.zeta`
- `backend/.env.zeta`

## 🔍 验证部署

### 1. 检查合约
访问 [ZetaChain浏览器](https://athens.explorer.zetachain.com) 查看部署的合约

### 2. 测试前端
1. 访问 http://localhost:5173
2. 连接MetaMask到ZetaChain测试网
3. 测试基本功能

### 3. 验证Method 4功能
创建测试脚本验证原子操作：
```bash
npx ts-node scripts/testMethod4ZetaTestnet.ts
```

## 🚨 故障排除

### 部署失败
1. **余额不足**: 获取更多测试ZETA代币
2. **网络连接**: 检查RPC URL是否可访问
3. **私钥错误**: 确认私钥格式正确

### 前端连接问题
1. 确认MetaMask连接到正确网络
2. 检查合约地址是否正确更新
3. 清除浏览器缓存重试

### 交易失败
1. 检查gas费设置
2. 确认账号有足够ZETA余额
3. 等待网络确认后重试

## 🎉 成功标志

部署成功后，你应该看到：
- ✅ 所有合约部署成功
- ✅ 前端可以连接到ZetaChain
- ✅ Method 4原子操作正常工作
- ✅ TaskID解析问题完全解决

## 📞 支持

如果遇到问题：
1. 检查 [ZetaChain文档](https://docs.zetachain.com/)
2. 访问 [ZetaChain Discord](https://discord.gg/zetachain)
3. 查看合约在区块浏览器上的状态

---

**准备好在真实网络上测试Method 4了！** 🚀