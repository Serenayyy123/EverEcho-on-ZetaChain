# 🚀 Deploy to Staging NOW - Quick Start

**Follow these steps to deploy in the next 30 minutes**

---

## 📦 What You're Deploying

- **Backend**: Render Web Service + PostgreSQL
- **Frontend**: Vercel
- **Network**: Base Sepolia (chainId 84532)

---

## ⚡ Quick Deploy (30 Minutes)

### Step 1: Commit Code (2 minutes)

```bash
# Verify vercel.json exists
ls frontend/vercel.json

# If not, it was just created - commit it
git add frontend/vercel.json
git commit -m "feat: add Vercel SPA routing configuration"
git push origin main
```

---

### Step 2: Deploy Backend on Render (10 minutes)

#### 2.1 Create Database
1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Name: `everecho-staging-db`
4. Click "Create Database"
5. **Copy Internal Database URL** (save it!)

#### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - Name: `everecho-staging-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && node dist/index.js`

#### 2.3 Add Environment Variables
```bash
DATABASE_URL=<paste Internal Database URL from step 2.1>
PORT=3001
NODE_ENV=production
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
CHAIN_ID=84532
ENABLE_EVENT_LISTENER=false
ENABLE_CHAIN_SYNC=true
CORS_ORIGIN=*
```

#### 2.4 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. **Copy backend URL**: `https://everecho-staging-backend.onrender.com`

#### 2.5 Verify
```bash
curl https://YOUR_BACKEND_URL/healthz
# Should return: {"status":"ok",...}
```

---

### Step 3: Deploy Frontend on Vercel (10 minutes)

#### 3.1 Create Project
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### 3.2 Add Environment Variables
```bash
VITE_BACKEND_BASE_URL=<paste your Render backend URL>
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

#### 3.3 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. **Copy frontend URL**: `https://your-app.vercel.app`

---

### Step 4: Update CORS (2 minutes)

1. Go back to Render backend
2. Environment tab
3. Update `CORS_ORIGIN` to your Vercel URL
4. Save (auto-redeploys)

---

### Step 5: Test (5 minutes)

#### Quick Test
1. Open your Vercel URL
2. Connect MetaMask (Base Sepolia)
3. Register a test account
4. Create a test task
5. Check Profile stats display correctly

#### If Everything Works
✅ **Deployment Complete!**

#### If Something Fails
📖 See detailed guide: `docs/RENDER_VERCEL_STAGING_DEPLOYMENT.md`

---

## 📋 Environment Variables Reference

### Backend (Render)
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001
NODE_ENV=production
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
CHAIN_ID=84532
ENABLE_EVENT_LISTENER=false
ENABLE_CHAIN_SYNC=true
CORS_ORIGIN=https://your-app.vercel.app
```

### Frontend (Vercel)
```bash
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

---

## 🆘 Quick Troubleshooting

### Backend health check fails
```bash
# Check Render logs for errors
# Common issues:
# - DATABASE_URL wrong format
# - Prisma migrations failed
# - RPC connection failed
```

### Frontend shows blank page
```bash
# Check browser console
# Common issues:
# - VITE_ prefix missing on env vars
# - CORS error (update backend CORS_ORIGIN)
# - Backend URL wrong
```

### CORS errors
```bash
# Update backend CORS_ORIGIN to match frontend URL exactly
# No trailing slash!
# Must be HTTPS
```

---

## 📚 Full Documentation

- **Complete Guide**: `docs/RENDER_VERCEL_STAGING_DEPLOYMENT.md`
- **Checklist**: `docs/STAGING_DEPLOYMENT_CHECKLIST.md`
- **Code Changes**: `docs/STAGING_CODE_CHANGES_REQUIRED.md`

---

## ✅ Success Checklist

- [ ] Backend deployed and health check passes
- [ ] Frontend deployed and loads
- [ ] Can connect wallet
- [ ] Can register account
- [ ] Can create task
- [ ] Profile stats display correctly
- [ ] No console errors

---

**Ready? Let's deploy!** 🚀

Start with Step 1 above.
