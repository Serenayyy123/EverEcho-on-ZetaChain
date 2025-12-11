# Pre-Staging Checklist ✅

## 📊 System Status (Automated Check)

### ✅ Chain State
- **Chain ID**: 84532 (Base Sepolia)
- **RPC**: https://sepolia.base.org
- **TaskCounter**: 4
- **Next TaskId**: 5
- **Status**: ✅ Ready to create new tasks

### ✅ Database State
- **Total Tasks**: 4 (on chain 84532)
- **Tasks**: 1, 2, 3, 4
- **ContactKeys**: All 4 tasks have creator + helper keys
- **Status**: ✅ Synced with chain

### ✅ Contract Addresses
- **EOCHO Token**: `0xe7940e81dDf4d6415f2947829938f9A24B0ad35d`
- **Register**: `0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151`
- **TaskEscrow**: `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28`
- **Status**: ✅ All deployed on Base Sepolia

### ✅ Environment Configuration
- **Backend Port**: 3001
- **Frontend Backend URL**: http://localhost:3001
- **Chain ID**: 84532 (consistent across frontend/backend)
- **CORS**: Configured for localhost:5173
- **Status**: ✅ Properly configured

---

## 🧪 Manual Regression Tests

### Journey 1: Create Task ✅

**Steps**:
1. ✅ Navigate to "Publish Task"
2. ✅ Fill in task details:
   - Title: "Test Task for Staging"
   - Description: "Testing before staging deployment"
   - Contacts: Your telegram/email
   - Reward: 10 ECHO
   - Category: Any
3. ✅ Click "Publish Task"
4. ✅ Approve ECHO transfer (MetaMask)
5. ✅ Wait for metadata upload
6. ✅ Confirm on-chain transaction
7. ✅ Task appears in Task Square

**Expected Results**:
- Console logs: "Chain taskCounter: 4", "Next taskId: 5"
- No 500 errors or retries
- Transaction confirms within 30 seconds
- Task 5 appears in Task Square immediately

**Status**: ⬜ Not tested yet

---

### Journey 2: Accept → Submit → Confirm ✅

**Steps**:
1. ✅ Switch to a different wallet (or use another browser)
2. ✅ Register if not registered
3. ✅ Navigate to Task Square
4. ✅ Find an "Open" task
5. ✅ Click "Accept Task"
6. ✅ Confirm transaction
7. ✅ Click "Submit Work"
8. ✅ Confirm transaction
9. ✅ Switch back to creator wallet
10. ✅ Click "Confirm Complete"
11. ✅ Confirm transaction

**Expected Results**:
- Task status updates correctly at each step
- Transactions confirm successfully
- No errors or stuck states

**Status**: ⬜ Not tested yet

---

### Journey 3: View Contacts ✅

**Steps**:
1. ✅ As creator, view a task you created (after helper accepted)
2. ✅ Click "View Contacts"
3. ✅ Sign message to decrypt
4. ✅ See helper's contacts
5. ✅ Switch to helper wallet
6. ✅ View the same task
7. ✅ Click "View Contacts"
8. ✅ Sign message to decrypt
9. ✅ See creator's contacts

**Expected Results**:
- Contacts decrypt successfully
- Correct contacts shown for each role
- No decryption errors

**Status**: ⬜ Not tested yet

---

## 🔧 Configuration Verification

### Backend (.env)
```properties
✅ DATABASE_URL=file:./dev.db
✅ PORT=3001
✅ RPC_URL=https://sepolia.base.org
✅ TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
✅ CHAIN_ID=84532
✅ ENABLE_EVENT_LISTENER=true
✅ ENABLE_CHAIN_SYNC=true
✅ CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```properties
✅ VITE_BACKEND_BASE_URL=http://localhost:3001
✅ VITE_CHAIN_ID=84532
✅ VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
✅ VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
✅ VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

---

## 📋 Known Issues (Fixed)

### ✅ Fixed Issues
1. ✅ **TaskId Calculation**: Frontend now correctly uses `taskCounter + 1`
2. ✅ **Prisma Composite Keys**: All queries now use `chainId_taskId` composite key
3. ✅ **Database Orphan Tasks**: Cleaned up tasks 4-13 that didn't exist on chain
4. ✅ **TaskData Interface**: Added `creatorAddress` and `category` fields
5. ✅ **Error Logging**: Enhanced to show actual backend errors

### ⚠️ Potential Issues to Watch
1. **RPC Rate Limiting**: Base Sepolia public RPC may have rate limits
2. **Transaction Delays**: Network congestion may cause slow confirmations
3. **MetaMask Nonce Issues**: If creating multiple tasks quickly
4. **Browser Cache**: May need hard refresh after updates

---

## 🚀 Ready for Staging?

### Automated Checks: ✅ 5/5 Passed
- ✅ Chain state verified
- ✅ Database synced
- ✅ Contracts deployed
- ✅ Environment configured
- ✅ No diagnostics errors

### Manual Tests: ⬜ 0/3 Completed
- ⬜ Journey 1: Create Task
- ⬜ Journey 2: Accept → Submit → Confirm
- ⬜ Journey 3: View Contacts

### Next Steps:
1. **Complete manual regression tests** (15-20 minutes)
2. **Document any issues found**
3. **Fix critical issues** (if any)
4. **Proceed to staging deployment**

---

## 📝 Test Results Log

### Test Run: [Date/Time]

**Journey 1: Create Task**
- [ ] Started
- [ ] Approved ECHO
- [ ] Metadata uploaded
- [ ] Transaction confirmed
- [ ] Task appeared in UI
- Result: ⬜ Pass / ⬜ Fail
- Notes: 

**Journey 2: Accept → Submit → Confirm**
- [ ] Accepted task
- [ ] Submitted work
- [ ] Confirmed complete
- Result: ⬜ Pass / ⬜ Fail
- Notes:

**Journey 3: View Contacts**
- [ ] Creator viewed helper contacts
- [ ] Helper viewed creator contacts
- Result: ⬜ Pass / ⬜ Fail
- Notes:

---

## ✅ Sign-off

- [ ] All automated checks passed
- [ ] All manual tests passed
- [ ] No critical issues found
- [ ] Ready for staging deployment

**Signed**: ________________  
**Date**: ________________
