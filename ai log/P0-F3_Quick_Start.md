# P0-F3 快速开始指南

## 🚀 5 分钟启动

### 1. 确保前置条件

```bash
# Backend 运行中
cd backend
npm run dev

# 合约已部署
# 用户已注册（通过 P0-F1）
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173/profile

### 3. 测试流程

1. **连接钱包**（确保是已注册的地址）
2. **访问 Profile 页面**：`/profile`
3. **查看 Profile 信息**：nickname, city, skills, EOCHO 余额
4. **切换标签页**：我发布的任务 / 我接受的任务
5. **点击任务卡片**：跳转到任务详情

---

## 📋 功能清单

### Profile 信息展示
- ✅ Nickname（链下）
- ✅ City（链下）
- ✅ Skills 标签（链下）
- ✅ EOCHO 余额（链上）
- ✅ 钱包地址

### 任务历史
- ✅ 我发布的任务（Creator 视角）
- ✅ 我接受的任务（Helper 视角）
- ✅ 任务状态展示
- ✅ 金额变动语义
- ✅ 时间戳显示
- ✅ 点击跳转详情

---

## 🎯 金额变动语义

### Creator 视角
| 状态 | 显示文本 |
|------|---------|
| Open | Deposited X EOCHO |
| InProgress | Deposited X EOCHO (locked) |
| Submitted | Deposited X EOCHO (under review) |
| Completed | Paid X EOCHO to Helper |
| Cancelled | Refunded X EOCHO |

### Helper 视角
| 状态 | 显示文本 |
|------|---------|
| Open | - |
| InProgress | Deposited X EOCHO (locked) |
| Submitted | Deposited X EOCHO (under review) |
| Completed | Received 0.98X EOCHO + Deposit X refunded (Fee 0.02X burned) |
| Cancelled | Refunded X EOCHO |

---

## 🔧 故障排查

### 问题：显示"Failed to load profile"
- 检查 Backend 是否运行
- 确认该地址是否已注册
- 查看浏览器控制台错误

### 问题：EOCHO 余额显示为 0
- 检查合约地址是否正确
- 确认网络是否匹配
- 检查该地址是否有 EOCHO Token

### 问题：任务历史为空
- 确认该地址是否创建/接受过任务
- 检查 TaskEscrow 合约地址
- 查看浏览器控制台错误

### 问题：标签切换无反应
- 刷新页面重试
- 检查浏览器控制台错误

---

## 📚 相关文档

- 完整实现总结：`P0-F3_Implementation_Summary.md`
- P0-F1 注册流程：`P0-F1_实现总结.md`
- P0-F2 任务广场：`P0-F2_实现总结.md`
- PRD 文档：`PRD.md`
