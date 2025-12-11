# 钱包断开修复补丁

## 问题
用户在认证页面断开钱包后，页面不会自动返回首页，而是停留在空数据页面。

## 修复
在 4 个需要认证的页面添加 `useEffect` 监听 `address` 变化，断开时自动导航到首页。

## 修改的文件
- ✅ `frontend/src/pages/Profile.tsx`
- ✅ `frontend/src/pages/TaskSquare.tsx`
- ✅ `frontend/src/pages/PublishTask.tsx`
- ✅ `frontend/src/pages/TaskDetail.tsx`
- ✅ `frontend/src/pages/Register.tsx`

## 验证
```bash
# 运行验证脚本
.\scripts\verify-disconnect-fix.ps1

# 结果：所有检查通过 ✅
```

## 测试步骤
1. 启动开发服务器
2. 连接 MetaMask 钱包
3. 访问任意认证页面（Register/Profile/TaskSquare/PublishTask/TaskDetail）
4. 在 MetaMask 中断开钱包
5. 验证页面自动跳转到首页

## 详细文档
查看 `docs/WALLET_DISCONNECT_FIX.md` 了解完整的修复说明和验收清单。
