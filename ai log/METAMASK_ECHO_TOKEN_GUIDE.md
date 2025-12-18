# 📱 MetaMask导入ECHO代币完整指南

## 🎯 正确的ECHOToken信息

**✅ 正确的合约地址**: `0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd`

- **代币名称**: ECHO Token
- **代币符号**: ECHO  
- **小数位数**: 18
- **网络**: ZetaChain Athens Testnet (Chain ID: 7001)

## 📋 步骤1: 添加ZetaChain网络

如果你还没有添加ZetaChain网络，请先添加：

1. 打开MetaMask
2. 点击网络下拉菜单
3. 点击"添加网络"
4. 点击"手动添加网络"
5. 输入以下信息：

| 字段 | 值 |
|------|-----|
| **网络名称** | `ZetaChain Athens Testnet` |
| **新RPC URL** | `https://zetachain-athens-evm.blockpi.network/v1/rpc/public` |
| **链ID** | `7001` |
| **货币符号** | `ZETA` |
| **区块浏览器URL** | `https://athens.explorer.zetachain.com` |

6. 点击"保存"

## 📋 步骤2: 导入ECHO代币

1. **确保连接到ZetaChain网络**
   - 在MetaMask中选择"ZetaChain Athens Testnet"

2. **导入代币**
   - 在MetaMask主界面，滚动到代币列表底部
   - 点击"导入代币"
   - 选择"自定义代币"标签

3. **输入代币信息**
   - **代币合约地址**: `0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd`
   - **代币符号**: `ECHO` (应该自动填入)
   - **小数精度**: `18` (应该自动填入)

4. **完成导入**
   - 点击"添加自定义代币"
   - 确认添加

## 🔍 验证导入成功

导入成功后，你应该能看到：
- ECHO代币出现在你的代币列表中
- 显示你的ECHO余额（如果有的话）

## 🚨 常见问题解决

### ❌ 问题1: "无法获取代币信息"
**原因**: MetaMask没有连接到ZetaChain网络
**解决**: 确保选择了"ZetaChain Athens Testnet"网络

### ❌ 问题2: "代币地址无效"
**原因**: 输入了错误的合约地址
**解决**: 使用正确地址 `0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd`

### ❌ 问题3: "网络连接失败"
**原因**: RPC连接问题
**解决**: 
1. 检查网络连接
2. 尝试刷新MetaMask
3. 重新添加ZetaChain网络

### ❌ 问题4: "代币不显示余额"
**原因**: 账号没有ECHO代币
**解决**: 
1. 确认你的账号地址
2. 检查是否需要获取测试代币
3. 在区块浏览器中验证余额

## 🔗 有用的链接

- **区块浏览器**: https://athens.explorer.zetachain.com
- **ECHO代币合约**: https://athens.explorer.zetachain.com/address/0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd
- **ZetaChain水龙头**: https://labs.zetachain.com/get-zeta

## 🎉 成功标志

导入成功后，你应该看到：
- ✅ ECHO代币出现在MetaMask代币列表中
- ✅ 显示正确的代币符号"ECHO"
- ✅ 可以查看和发送ECHO代币
- ✅ 可以在EverEcho应用中正常使用

---

**注意**: 请确保使用正确的合约地址 `0x3BdD49A0De4D16E24796310C839e34eB419c1Cbd`，这是我们在ZetaChain测试网上部署的官方ECHOToken合约。