#!/bin/bash

# 验证钱包断开修复是否正确应用

echo "🔍 验证钱包断开修复..."
echo ""

# 检查所有需要认证的页面是否都添加了监听逻辑
FILES=(
  "frontend/src/pages/Profile.tsx"
  "frontend/src/pages/TaskSquare.tsx"
  "frontend/src/pages/PublishTask.tsx"
  "frontend/src/pages/TaskDetail.tsx"
  "frontend/src/pages/Register.tsx"
)

MISSING=0

for file in "${FILES[@]}"; do
  echo "检查 $file..."
  
  # 检查是否导入了 useEffect
  if ! grep -q "import.*useEffect" "$file"; then
    echo "  ❌ 缺少 useEffect 导入"
    MISSING=$((MISSING + 1))
  else
    echo "  ✅ 已导入 useEffect"
  fi
  
  # 检查是否添加了监听逻辑
  if ! grep -q "监听钱包断开" "$file"; then
    echo "  ❌ 缺少钱包断开监听逻辑"
    MISSING=$((MISSING + 1))
  else
    echo "  ✅ 已添加钱包断开监听"
  fi
  
  # 检查是否有 navigate('/') 调用
  if ! grep -q "navigate('/')" "$file"; then
    echo "  ❌ 缺少 navigate('/') 调用"
    MISSING=$((MISSING + 1))
  else
    echo "  ✅ 已添加 navigate('/') 调用"
  fi
  
  echo ""
done

if [ $MISSING -eq 0 ]; then
  echo "✅ 所有检查通过！钱包断开修复已正确应用。"
  echo ""
  echo "📋 下一步："
  echo "1. 启动开发服务器: npm run dev"
  echo "2. 连接 MetaMask 钱包"
  echo "3. 访问各个页面并测试断开钱包"
  echo "4. 验证页面自动跳转到首页"
  exit 0
else
  echo "❌ 发现 $MISSING 个问题，请检查上述错误。"
  exit 1
fi
