# Next TaskId Fix Patch

## 🎯 Problem

When creating a new task, the frontend was using:
```typescript
const nextTaskId = taskCounter.toString();
```

This is **wrong** because:
- `taskCounter` represents the **number of tasks created** (also the max taskId)
- If there are Task 1, 2, 3, then `taskCounter = 3`
- The next task should be `taskCounter + 1 = 4`, not `3`

This caused:
- Frontend logs "Next taskId: 3" when it should be "4"
- Backend receives taskId=3 in metadata upload
- Database primary key conflict (Task 3 already exists)
- Backend returns 500 error
- Frontend retries 5 times, all fail

## ✅ Solution

Changed the calculation to:
```typescript
const nextTaskId = (Number(taskCounter) + 1).toString();
```

Also added:
1. Better logging to show both `taskCounter` and `nextTaskId`
2. Defensive check to ensure the task doesn't already exist on chain

## 📝 Code Changes

### File: `frontend/src/hooks/useCreateTask.ts`

**Before:**
```typescript
// 3. 获取下一个 taskId（从合约读取 taskCounter）
setStep('Preparing task...');
const contract = new ethers.Contract(
  TASK_ESCROW_ADDRESS,
  TaskEscrowABI.abi,
  signer
);
const taskCounter = await contract.taskCounter();
const nextTaskId = taskCounter.toString();
console.log('Next taskId:', nextTaskId);
```

**After:**
```typescript
// 3. 获取下一个 taskId（从合约读取 taskCounter）
setStep('Preparing task...');
const contract = new ethers.Contract(
  TASK_ESCROW_ADDRESS,
  TaskEscrowABI.abi,
  signer
);
const taskCounter = await contract.taskCounter();
const nextTaskId = (Number(taskCounter) + 1).toString();
console.log('Chain taskCounter:', taskCounter.toString());
console.log('Next taskId:', nextTaskId);

// 防御性检查：确保 nextTaskId 在链上不存在
try {
  const existingTask = await contract.tasks(nextTaskId);
  // tasks() 返回一个 tuple，creator 是第二个元素
  if (existingTask[1] !== ethers.ZeroAddress) {
    throw new Error(
      `Task ${nextTaskId} already exists on chain. ` +
      `This should not happen. Please refresh and try again.`
    );
  }
} catch (err: any) {
  // 如果读取失败（任务不存在），这是正常的，继续
  if (!err.message?.includes('already exists')) {
    console.log(`Task ${nextTaskId} does not exist yet (expected)`);
  } else {
    throw err;
  }
}
```

## 🧪 Testing

### Before Fix
```
Chain taskCounter: 3
Next taskId: 3  ❌ Wrong!
Backend tries to create Task 3
Database conflict (Task 3 exists)
500 error, retries fail
```

### After Fix
```
Chain taskCounter: 3
Next taskId: 4  ✅ Correct!
Backend creates Task 4
No database conflict
Success!
```

## ✅ Acceptance Criteria

- [x] With chain taskCounter = 3, creating a new task logs "Next taskId: 4"
- [x] Backend `/api/task` succeeds on first try (no 500 retries)
- [x] Chain has Task 4 with correct metadata & category
- [x] TaskSquare immediately shows the new task
- [x] No other features regressed

## 📊 Impact

**Changed files**: 1
- `frontend/src/hooks/useCreateTask.ts`

**Lines changed**: ~20 lines (added defensive check + better logging)

**Risk**: Very low
- Only affects taskId calculation
- No changes to encryption, contacts, chain sync, or other features
- Defensive check prevents accidental overwrites

## 🔍 Related Issues

- Backend was already correctly using `taskCounter + 1`
- Database had orphan tasks (Task 4-13) which were cleaned up
- This fix ensures frontend and backend are aligned

## 📝 Notes

- The backend also reads `taskCounter` and calculates `nextTaskId = taskCounter + 1`
- Frontend now sends the correct taskId in metadata upload
- Backend can optionally validate that the taskId matches its own calculation
- The defensive check is a safety guard, not a fix for the root cause
