# 📋 Copy-Paste Commands for Staging Deployment

**All commands you need - just copy and paste**

---

## 🔧 Pre-Deployment

### Verify Local Build

```bash
# Backend
cd backend
npm install
npm run build
npx prisma validate
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..
```

### Commit vercel.json

```bash
# Check if file exists
ls frontend/vercel.json

# If exists, commit it
git add frontend/vercel.json
git commit -m "feat: add Vercel SPA routing configuration"
git push origin main
```

---

## 🗄️ Render Backend Configuration

### Build Command (Copy to Render)

```
npm install && npx prisma generate && npm run build
```

### Start Command (Copy to Render)

```
npx prisma migrate deploy && node dist/index.js
```

### Environment Variables (Copy to Render)

**Replace placeholders with your actual values!**

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
NODE_ENV=production
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
CHAIN_ID=84532
ENABLE_EVENT_LISTENER=false
ENABLE_CHAIN_SYNC=true
CHAIN_SYNC_INTERVAL_MS=60000
CORS_ORIGIN=*
```

**After frontend deployment, update CORS:**

```bash
CORS_ORIGIN=https://your-app.vercel.app
```

---

## 🎨 Vercel Frontend Configuration

### Build Settings (Configure in Vercel UI)

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables (Copy to Vercel)

**Replace backend URL with your actual Render URL!**

```bash
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com
VITE_CHAIN_ID=84532
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

---

## ✅ Verification Commands

### Test Backend Health

```bash
# Replace with your actual backend URL
curl https://everecho-staging-backend.onrender.com/healthz
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-26T...",
  "uptime": 123,
  "checks": {
    "database": "ok",
    "rpc": "ok"
  }
}
```

### Test Backend CORS

```bash
# Replace URLs with your actual URLs
curl -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://everecho-staging-backend.onrender.com/api/profile
```

**Expected**: Should return 200 with CORS headers

### Test Profile API

```bash
# Replace with your backend URL
curl https://everecho-staging-backend.onrender.com/api/profile/0x1234567890123456789012345678901234567890
```

**Expected**: 404 (profile doesn't exist yet) or profile data

---

## 🔍 Debugging Commands

### Check Render Logs

```bash
# In Render Dashboard → Your Service → Logs
# Or use Render CLI:
render logs -s everecho-staging-backend
```

### Check Prisma Migrations

```bash
# In Render Shell
npx prisma migrate status
```

### Check Database Tables

```bash
# In Render Shell or PostgreSQL client
psql $DATABASE_URL -c "\dt"
```

**Expected Tables:**
- Profile
- Task
- ContactKey
- _prisma_migrations

### Verify Prisma Client

```bash
# In Render Shell
npx prisma generate
node -e "const { PrismaClient } = require('@prisma/client'); console.log('Prisma OK')"
```

---

## 🔄 Redeploy Commands

### Redeploy Backend (Render)

```bash
# Option 1: Push to GitHub (auto-deploys)
git push origin main

# Option 2: Manual deploy in Render Dashboard
# Go to service → "Manual Deploy" → "Deploy latest commit"
```

### Redeploy Frontend (Vercel)

```bash
# Option 1: Push to GitHub (auto-deploys)
git push origin main

# Option 2: Vercel CLI
cd frontend
vercel --prod

# Option 3: Manual in Vercel Dashboard
# Go to Deployments → "Redeploy"
```

---

## 🗄️ Database Commands

### Run Migrations Manually

```bash
# In Render Shell
npx prisma migrate deploy
```

### Reset Database (CAUTION!)

```bash
# In Render Shell - THIS DELETES ALL DATA
npx prisma migrate reset --force
```

### View Database with Prisma Studio

```bash
# Locally, connecting to staging DB
DATABASE_URL="postgresql://..." npx prisma studio
```

### Export Database Schema

```bash
# In Render Shell
npx prisma db pull
```

---

## 🧪 Test Data Commands

### Create Test Profile (via API)

```bash
# Replace with your backend URL
curl -X POST https://everecho-staging-backend.onrender.com/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "nickname": "Test User",
    "city": "New York",
    "skills": ["JavaScript", "React"],
    "encryptionPubKey": "test_pub_key_base64",
    "contacts": "@testuser"
  }'
```

### Create Test Task (via API)

```bash
# Replace with your backend URL
curl -X POST https://everecho-staging-backend.onrender.com/api/task \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "1",
    "title": "Test Task",
    "description": "This is a test task",
    "contactsEncryptedPayload": "encrypted_data_here",
    "createdAt": "1234567890",
    "category": "Development",
    "creator": "0x1234567890123456789012345678901234567890"
  }'
```

---

## 📊 Monitoring Commands

### Check Backend Uptime

```bash
# Replace with your backend URL
curl https://everecho-staging-backend.onrender.com/healthz | jq '.uptime'
```

### Check RPC Connection

```bash
# In Render Shell
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
provider.getBlockNumber().then(n => console.log('Block:', n));
"
```

### Check Database Connection

```bash
# In Render Shell
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('DB OK')).finally(() => prisma.\$disconnect());
"
```

---

## 🔐 Environment Variable Commands

### List Vercel Environment Variables

```bash
# Using Vercel CLI
vercel env ls
```

### Add Vercel Environment Variable

```bash
# Using Vercel CLI
vercel env add VITE_NEW_VAR production
```

### Pull Vercel Environment Variables

```bash
# Download to local .env
vercel env pull
```

---

## 🚨 Emergency Commands

### Stop Backend (Render)

```bash
# In Render Dashboard
# Go to service → Settings → "Suspend Service"
```

### Rollback Deployment (Render)

```bash
# In Render Dashboard
# Go to service → Events → Find previous deployment → "Redeploy"
```

### Rollback Deployment (Vercel)

```bash
# In Vercel Dashboard
# Go to Deployments → Find previous deployment → "Promote to Production"
```

### Clear Render Build Cache

```bash
# In Render Dashboard
# Go to service → Settings → "Clear build cache"
```

---

## 📝 Quick Reference

### URLs Template

```bash
# Backend
https://everecho-staging-backend.onrender.com

# Frontend
https://your-app.vercel.app

# Health Check
https://everecho-staging-backend.onrender.com/healthz

# API Endpoints
https://everecho-staging-backend.onrender.com/api/profile
https://everecho-staging-backend.onrender.com/api/task
https://everecho-staging-backend.onrender.com/api/contacts
```

### Contract Addresses (Base Sepolia)

```bash
EOCHOToken:   0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
Register:     0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
TaskEscrow:   0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

### Network Info

```bash
Network: Base Sepolia
Chain ID: 84532
RPC URL: https://sepolia.base.org
Explorer: https://sepolia.basescan.org
```

---

## 💡 Pro Tips

### Use jq for JSON Formatting

```bash
# Install jq (if not installed)
# macOS: brew install jq
# Ubuntu: sudo apt install jq
# Windows: choco install jq

# Pretty print API responses
curl https://your-backend.onrender.com/healthz | jq '.'
```

### Watch Logs in Real-Time

```bash
# Render CLI
render logs -s everecho-staging-backend --tail

# Or use Render Dashboard → Logs (auto-refreshes)
```

### Test with Different Accounts

```bash
# Use MetaMask account switcher
# Or use different browsers/incognito windows
```

---

**Save this file for quick reference during deployment!** 📌
