# ✅ Staging Deployment Checklist

**Quick reference for deploying to Render + Vercel**

Print this page and check off items as you complete them.

---

## 📋 Pre-Deployment

### Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] Local build successful: `cd backend && npm run build`
- [ ] Local build successful: `cd frontend && npm run build`
- [ ] Prisma schema validated: `npx prisma validate`

### Account Setup
- [ ] Render account created (https://render.com)
- [ ] Vercel account created (https://vercel.com)
- [ ] GitHub repository accessible

### Information Gathered
- [ ] Base Sepolia RPC URL: `https://sepolia.base.org`
- [ ] Contract addresses confirmed:
  - [ ] EOCHOToken: `0xe7940e81dDf4d6415f2947829938f9A24B0ad35d`
  - [ ] Register: `0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151`
  - [ ] TaskEscrow: `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28`

---

## 🗄️ Backend Deployment (Render)

### Step 1: PostgreSQL Database
- [ ] Created new PostgreSQL database
- [ ] Name: `everecho-staging-db`
- [ ] Copied **Internal Database URL**
- [ ] Saved URL securely

### Step 2: Web Service
- [ ] Created new Web Service
- [ ] Name: `everecho-staging-backend`
- [ ] Connected GitHub repository
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install && npx prisma generate && npm run build`
- [ ] Start Command: `npx prisma migrate deploy && node dist/index.js`
- [ ] Health Check Path: `/healthz`

### Step 3: Environment Variables
- [ ] `DATABASE_URL` = (Internal Database URL from Step 1)
- [ ] `PORT` = `3001`
- [ ] `NODE_ENV` = `production`
- [ ] `RPC_URL` = `https://sepolia.base.org`
- [ ] `TASK_ESCROW_ADDRESS` = `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28`
- [ ] `CHAIN_ID` = `84532`
- [ ] `ENABLE_EVENT_LISTENER` = `false`
- [ ] `ENABLE_CHAIN_SYNC` = `true`
- [ ] `CORS_ORIGIN` = `*` (temporary, will update later)

### Step 4: Deploy & Verify
- [ ] Clicked "Create Web Service"
- [ ] Deployment completed successfully
- [ ] Copied backend URL: `https://everecho-staging-backend.onrender.com`
- [ ] Health check passes: `curl https://YOUR_BACKEND_URL/healthz`
- [ ] Response shows `"status": "ok"`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Project Setup
- [ ] Logged into Vercel
- [ ] Clicked "Add New..." → "Project"
- [ ] Imported GitHub repository
- [ ] Framework Preset: `Vite`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### Step 2: Environment Variables
- [ ] `VITE_BACKEND_BASE_URL` = (Your Render backend URL)
- [ ] `VITE_CHAIN_ID` = `84532`
- [ ] `VITE_EOCHO_TOKEN_ADDRESS` = `0xe7940e81dDf4d6415f2947829938f9A24B0ad35d`
- [ ] `VITE_REGISTER_ADDRESS` = `0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151`
- [ ] `VITE_TASK_ESCROW_ADDRESS` = `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28`
- [ ] All variables added to "Production" environment

### Step 3: SPA Routing Configuration
- [ ] Created `frontend/vercel.json` with rewrites config
- [ ] Committed and pushed to GitHub

### Step 4: Deploy & Verify
- [ ] Clicked "Deploy"
- [ ] Deployment completed successfully
- [ ] Copied frontend URL: `https://your-app.vercel.app`
- [ ] App loads without errors
- [ ] No console errors in browser DevTools

### Step 5: Update Backend CORS
- [ ] Went back to Render backend
- [ ] Updated `CORS_ORIGIN` = (Your Vercel frontend URL)
- [ ] Saved and redeployed backend

---

## ✅ Post-Deployment Verification

### Journey 1: Registration
- [ ] Opened frontend URL
- [ ] Connected MetaMask wallet
- [ ] Switched to Base Sepolia network (chainId 84532)
- [ ] Navigated to Register page
- [ ] Filled registration form
- [ ] Confirmed transaction
- [ ] Received 100 EOCHO tokens
- [ ] Profile displays correctly
- [ ] No console errors

### Journey 2: Task Creation
- [ ] Navigated to Publish Task page
- [ ] Filled task form
- [ ] Approved EOCHO spending (if first time)
- [ ] Confirmed task creation transaction
- [ ] Task appears in Task Square
- [ ] Task metadata displays correctly
- [ ] Profile stats show "Tasks Created (1)"
- [ ] Stats display immediately (without clicking tabs)
- [ ] No console errors

### Journey 3: Task Acceptance
- [ ] Switched to different MetaMask account
- [ ] Registered helper account
- [ ] Found and accepted task
- [ ] Task status changed to "In Progress"
- [ ] Clicked "View Contacts"
- [ ] Signed message for decryption
- [ ] Contacts decrypted successfully
- [ ] Decrypted contacts match creator's info
- [ ] No console errors

### Technical Verification
- [ ] Browser console: No CORS errors
- [ ] Browser console: No 404 errors
- [ ] Browser console: No undefined env var warnings
- [ ] Render logs: No database errors
- [ ] Render logs: No RPC errors
- [ ] Render logs: API requests logging correctly

---

## 🐛 Troubleshooting Checklist

If something doesn't work, check:

### Backend Issues
- [ ] DATABASE_URL uses PostgreSQL format (not SQLite)
- [ ] DATABASE_URL is the Internal Database URL
- [ ] Prisma migrations ran successfully
- [ ] RPC_URL is accessible
- [ ] TASK_ESCROW_ADDRESS matches deployed contract
- [ ] CHAIN_ID is 84532 (Base Sepolia)
- [ ] Health check endpoint returns 200

### Frontend Issues
- [ ] All env vars start with `VITE_`
- [ ] VITE_BACKEND_BASE_URL has no trailing slash
- [ ] VITE_BACKEND_BASE_URL uses HTTPS
- [ ] vercel.json exists with rewrites config
- [ ] Redeployed after adding env vars

### CORS Issues
- [ ] CORS_ORIGIN matches frontend URL exactly
- [ ] CORS_ORIGIN has no trailing slash
- [ ] CORS_ORIGIN uses HTTPS (not HTTP)
- [ ] Backend redeployed after CORS update

### Contract Issues
- [ ] All contract addresses match on frontend and backend
- [ ] Contracts deployed on Base Sepolia (chainId 84532)
- [ ] Contracts verified on BaseScan

---

## 📝 Deployment Summary

Fill in your deployment details:

```
Backend URL: https://_____________________________.onrender.com
Frontend URL: https://_____________________________.vercel.app
Database: everecho-staging-db (Render PostgreSQL)
Network: Base Sepolia (chainId 84532)
Deployment Date: _______________
Deployed By: _______________
```

---

## 🎉 Success!

- [ ] All checklist items completed
- [ ] All 3 journeys verified
- [ ] No errors in logs or console
- [ ] Staging environment ready for testing

**Next Steps:**
1. Share staging URL with team
2. Begin user acceptance testing
3. Monitor logs for issues
4. Collect feedback

---

**Keep this checklist for future deployments!**
