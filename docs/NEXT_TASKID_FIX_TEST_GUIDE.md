# Next TaskId Fix - Test Guide

## 🎯 Quick Test

### Prerequisites
1. Backend and frontend are running
2. Wallet is connected
3. Chain has Task 1, 2, 3 (taskCounter = 3)
4. Database has Task 1, 2, 3 (orphan tasks cleaned)

### Test Steps

#### 1. Open Browser Console
- Open DevTools (F12)
- Go to Console tab

#### 2. Create a New Task
- Navigate to "Publish Task" page
- Fill in:
  - Title: "Test Task 4"
  - Description: "Testing nextTaskId fix"
  - Contacts: (your contacts from profile)
  - Reward: 10 ECHO
  - Category: Any
- Click "Publish Task"

#### 3. Check Console Logs

**Expected logs:**
```
Chain taskCounter: 3
Next taskId: 4
Task 4 does not exist yet (expected)
Approve transaction sent: 0x...
Approve transaction confirmed
Task metadata uploaded successfully, taskURI: https://...
Transaction sent: 0x...
Transaction confirmed: ...
```

**Key points:**
- ✅ "Chain taskCounter: 3"
- ✅ "Next taskId: 4" (not 3!)
- ✅ "Task metadata uploaded successfully" (no retries)
- ✅ "Transaction confirmed"

#### 4. Verify Task Created

**On Chain:**
```bash
cd backend
npx ts-node scripts/verify-chain-state.ts
```

Expected output:
```
taskCounter: 4 (number of tasks created)
Next taskId will be: 5
Task 4 EXISTS:
  creator: 0x...
  taskURI: https://...
```

**In Database:**
```bash
npx ts-node scripts/check-db-state.ts
```

Expected output:
```
Tasks on current chain (84532):
  Total: 4 tasks
    Task 1: ...
    Task 2: ...
    Task 3: ...
    Task 4: "Test Task 4"
```

**In UI:**
- Go to Task Square
- Task 4 should appear in the list
- Click on Task 4
- All details should be correct

## 🧪 Regression Tests

Run these 3 demo journeys to ensure nothing broke:

### Journey 1: Creator Flow
1. Create a new task (Task 5)
2. Check it appears in Task Square
3. Check it appears in Profile > My Tasks

### Journey 2: Helper Flow
1. Accept Task 4 (as a different user)
2. Submit work
3. Creator confirms complete
4. Check task status updates correctly

### Journey 3: Contacts Flow
1. As creator, view Task 4 contacts (should see helper's contacts)
2. As helper, view Task 4 contacts (should see creator's contacts)
3. Verify contacts are decrypted correctly

## ❌ What Should NOT Happen

- ❌ Console shows "Next taskId: 3" (should be 4)
- ❌ Backend returns 500 error
- ❌ "Retrying upload (1/5)..." messages
- ❌ Task 3 gets overwritten
- ❌ Database primary key conflict error

## ✅ Success Criteria

- [x] Console logs "Next taskId: 4"
- [x] Backend succeeds on first try (no retries)
- [x] Task 4 created on chain
- [x] Task 4 appears in database
- [x] Task 4 appears in UI
- [x] All 3 regression tests pass

## 🐛 If Test Fails

### If still logs "Next taskId: 3"
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Restart frontend dev server

### If backend still returns 500
- Check backend logs for actual error
- Verify database was cleaned (no Task 4-13)
- Run `npx ts-node scripts/check-db-state.ts`

### If defensive check triggers
```
Error: Task 4 already exists on chain
```
- This means Task 4 was already created
- Run verification scripts to check state
- May need to create Task 5 instead

## 📝 Notes

- This fix only changes frontend taskId calculation
- Backend logic was already correct
- Database was cleaned in previous step
- No other features should be affected
