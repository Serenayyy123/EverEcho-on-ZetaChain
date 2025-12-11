# Step A2 Patch-1 使用说明

## 修复内容

修复冻结点 1.2-8：CAP 满时 mintedAmount=0 的提示

## 修改文件

- `frontend/src/hooks/useRegister.ts`

## 新增功能

### 1. capReached 状态
```typescript
const { register, isRegistering, error, txHash, capReached } = useRegister(
  signer,
  chainId,
  (mintedAmount) => {
    console.log('Minted amount:', mintedAmount);
  }
);
```

### 2. onSuccess 回调参数
```typescript
// 之前
onSuccess?: () => void

// 现在
onSuccess?: (mintedAmount: string) => void
```

## 在页面中使用

### 示例 1：显示 CAP 满提示

```typescript
import { useRegister } from '../hooks/useRegister';

function RegisterPage() {
  const { signer, chainId } = useWallet();
  const { register, isRegistering, error, capReached } = useRegister(
    signer,
    chainId,
    (mintedAmount) => {
      if (mintedAmount === '0.0') {
        alert('CAP reached, no EOCHO minted. Please earn EOCHO by completing tasks.');
      } else {
        alert(`Registration successful! You received ${mintedAmount} EOCHO.`);
      }
    }
  );

  const handleRegister = async () => {
    const success = await register({
      name: 'Alice',
      bio: 'Developer',
    });

    if (success && capReached) {
      // 显示 CAP 满提示
      console.warn('CAP reached');
    }
  };

  return (
    <div>
      <button onClick={handleRegister} disabled={isRegistering}>
        Register
      </button>
      
      {capReached && (
        <div style={{ color: 'orange', marginTop: '10px' }}>
          ⚠️ CAP reached, no EOCHO minted. Please earn EOCHO by completing tasks.
        </div>
      )}
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
```

### 示例 2：使用 Toast 通知

```typescript
import { useRegister } from '../hooks/useRegister';
import { toast } from 'react-toastify'; // 或其他 toast 库

function RegisterPage() {
  const { signer, chainId } = useWallet();
  const { register, isRegistering } = useRegister(
    signer,
    chainId,
    (mintedAmount) => {
      if (mintedAmount === '0.0') {
        toast.warning('CAP reached, no EOCHO minted. Please earn EOCHO by completing tasks.');
      } else {
        toast.success(`Registration successful! You received ${mintedAmount} EOCHO.`);
      }
    }
  );

  // ...
}
```

### 示例 3：使用 Modal 弹窗

```typescript
import { useState } from 'react';
import { useRegister } from '../hooks/useRegister';

function RegisterPage() {
  const [showCapModal, setShowCapModal] = useState(false);
  const { signer, chainId } = useWallet();
  
  const { register, isRegistering } = useRegister(
    signer,
    chainId,
    (mintedAmount) => {
      if (mintedAmount === '0.0') {
        setShowCapModal(true);
      }
    }
  );

  return (
    <div>
      {/* 注册表单 */}
      
      {showCapModal && (
        <div style={modalStyles}>
          <h3>CAP Reached</h3>
          <p>No EOCHO was minted because the token CAP has been reached.</p>
          <p>You can still use the platform and earn EOCHO by completing tasks.</p>
          <button onClick={() => setShowCapModal(false)}>OK</button>
        </div>
      )}
    </div>
  );
}
```

## 技术细节

### 余额检查逻辑

1. **注册前**：读取用户 EOCHO 余额（balanceBefore）
2. **注册中**：调用 register(profileURI)
3. **注册后**：读取用户 EOCHO 余额（balanceAfter）
4. **计算**：mintedAmount = balanceAfter - balanceBefore
5. **判断**：如果 mintedAmount = 0，设置 capReached = true

### 不影响现有逻辑

- ✅ 注册流程不变
- ✅ 不新增链上调用（仅读取余额）
- ✅ 向后兼容（onSuccess 参数可选）
- ✅ 不影响注册成功/失败判断

### 冻结点符合性

- ✅ 冻结点 1.2-8：检测并提示 CAP 满
- ✅ 冻结点 1.1-5：不绕过 register()
- ✅ 冻结点 1.2-7：INITIAL_MINT=100e18（通过余额变化检测）

## 测试方法

### 1. 正常注册（CAP 未满）
```
注册前余额: 0 EOCHO
注册后余额: 100 EOCHO
mintedAmount: 100 EOCHO
capReached: false
```

### 2. CAP 满注册
```
注册前余额: 0 EOCHO
注册后余额: 0 EOCHO
mintedAmount: 0 EOCHO
capReached: true
提示: "CAP reached, no EOCHO minted..."
```

### 3. 重复注册（应该 revert）
```
合约 revert: AlreadyRegistered
error: "Registration failed"
capReached: false
```

## 日志输出

```
Uploading profile to backend...
Profile URI: https://api.everecho.io/profile/0x123.json
Balance before registration: 0.0
Calling register contract...
Transaction sent: 0xabc...
Transaction confirmed: 0xabc...
Balance after registration: 100.0
Minted amount: 100.0
```

或（CAP 满时）：

```
...
Balance after registration: 0.0
Minted amount: 0.0
⚠️ CAP reached: no EOCHO minted
```

---

**Patch-1 已完成，符合冻结点 1.2-8 要求！** ✅
