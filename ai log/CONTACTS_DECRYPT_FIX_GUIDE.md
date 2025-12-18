# 联系方式解密 HTTP 404 问题修复指南

## 问题分析

**症状**: 前端报告 `POST http://localhost:3001/api/contacts/decrypt 404 (Not Found)`

**根本原因**: 这不是后端代码问题，而是前端到后端的网络连接问题。

**证据**:
- ✅ 后端 `/api/contacts/decrypt` 端点存在且正常工作
- ✅ 直接 curl 测试返回 400 (参数错误) 而不是 404
- ✅ 所有路由注册和代码都正确
- ❌ 前端浏览器请求返回 404，说明请求没有到达正确的后端路由

## 立即修复方案 (按优先级)

### 方案 1: 清除缓存和重启服务 ⭐⭐⭐

```bash
# 1. 清除浏览器缓存
# 在浏览器中按 Ctrl+Shift+R 或 Cmd+Shift+R 强制刷新

# 2. 重启前端开发服务器
cd frontend
npm run dev

# 3. 如果问题仍存在，重启后端服务
cd backend  
npm run dev
```

### 方案 2: 检查 Vite 代理配置 ⭐⭐

检查 `frontend/vite.config.ts` 是否有代理配置问题：

```typescript
// frontend/vite.config.ts
export default defineConfig({
  // ... 其他配置
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### 方案 3: 添加网络连接重试机制 ⭐⭐

修改前端 API 客户端，添加重试和更好的错误处理：

```typescript
// frontend/src/api/client.ts
private async request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<T> {
  const url = `${this.baseURL}${endpoint}`;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: response.statusText,
          status: response.status 
        }));
        
        // 如果是 404 且不是最后一次重试，等待后重试
        if (response.status === 404 && i < retries) {
          console.warn(`API request failed with 404, retrying... (${i + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`Network error, retrying... (${i + 1}/${retries + 1})`, err);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### 方案 4: 添加连接健康检查 ⭐

在前端添加后端连接健康检查：

```typescript
// frontend/src/hooks/useBackendHealth.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      await fetch('http://localhost:3001/healthz');
      setIsHealthy(true);
      setLastCheck(new Date());
    } catch (error) {
      console.warn('Backend health check failed:', error);
      setIsHealthy(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, lastCheck, checkHealth };
}
```

## 长期解决方案

### 1. 改进错误处理和用户体验

```typescript
// frontend/src/hooks/useContacts.ts
const loadContacts = async () => {
  // ... 现有代码 ...
  
  try {
    const response = await apiClient.decryptContacts({
      taskId,
      address,
      signature,
      message,
    });
    // ... 处理成功响应 ...
  } catch (err: any) {
    console.error('Load contacts failed:', err);
    
    let errorMessage = 'Failed to load contacts';
    
    // 改进错误处理
    if (err.message?.includes('404')) {
      errorMessage = 'Backend service temporarily unavailable. Please try again in a moment.';
    } else if (err.code === 'ACTION_REJECTED') {
      errorMessage = 'Signature rejected by user';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    setLoading(false);
  }
};
```

### 2. 添加开发环境检测脚本

```typescript
// scripts/checkDevEnvironment.ts
async function checkDevEnvironment() {
  console.log('🔍 检查开发环境连接...\n');
  
  // 检查后端服务
  try {
    const response = await fetch('http://localhost:3001/healthz');
    console.log('✅ 后端服务正常');
  } catch (error) {
    console.log('❌ 后端服务连接失败:', error);
    return false;
  }
  
  // 检查关键端点
  const endpoints = [
    '/api/contacts/decrypt',
    '/api/task',
    '/api/profile'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'test' })
      });
      
      // 404 = 端点不存在, 400 = 端点存在但参数错误
      if (response.status === 404) {
        console.log(`❌ ${endpoint} 端点不存在`);
        return false;
      } else {
        console.log(`✅ ${endpoint} 端点正常`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} 连接失败:`, error);
      return false;
    }
  }
  
  return true;
}
```

### 3. 配置文件验证

```typescript
// scripts/validateConfig.ts
function validateFrontendConfig() {
  const requiredEnvVars = [
    'VITE_BACKEND_BASE_URL',
    'VITE_CHAIN_ID',
    'VITE_TASK_ESCROW_ADDRESS'
  ];
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少环境变量:', missing);
    return false;
  }
  
  console.log('✅ 前端环境变量配置正确');
  return true;
}
```

## 预防措施

1. **定期健康检查**: 添加自动化脚本定期检查前后端连接
2. **更好的错误提示**: 区分网络错误和业务逻辑错误
3. **开发环境文档**: 创建清晰的开发环境设置指南
4. **监控和告警**: 在开发环境中添加基本的服务监控

## 执行步骤

1. **立即执行**: 方案 1 (清除缓存和重启服务)
2. **如果问题持续**: 检查方案 2 (Vite 代理配置)
3. **长期改进**: 实施方案 3 和 4 (重试机制和健康检查)

## 验证修复

修复后，运行以下命令验证：

```bash
# 测试后端端点
curl -X POST http://localhost:3001/api/contacts/decrypt \
  -H "Content-Type: application/json" \
  -d '{"test":"test"}'

# 应该返回 400 Bad Request (参数错误) 而不是 404
```

如果返回 400，说明端点正常工作。如果前端仍然报 404，则是前端网络配置问题。