# 🚀 Staging Deployment Guide: Render + Vercel

**Complete step-by-step guide for deploying EverEcho to staging environment**

- **Backend**: Render Web Service + PostgreSQL
- **Frontend**: Vercel
- **Blockchain**: Base Sepolia (chainId 84532)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] GitHub repository with latest code pushed
- [ ] Render account (sign up at https://render.com)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Base Sepolia RPC URL (e.g., https://sepolia.base.org)
- [ ] Contract addresses deployed on Base Sepolia:
  - EOCHOToken: `0xe7940e81dDf4d6415f2947829938f9A24B0ad35d`
  - Register: `0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151`
  - TaskEscrow: `0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28`

### ✅ Local Verification

```bash
# 1. Ensure all tests pass locally
cd backend
npm run build

cd ../frontend
npm run build

# 2. Verify Prisma schema is correct
cd ../backend
npx prisma validate
```

---

## Backend Deployment (Render)

### Step 1: Create PostgreSQL Database

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com

2. **Create New PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - **Name**: `everecho-staging-db`
   - **Database**: `everecho_staging`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (for staging)
   - Click "Create Database"

3. **Save Database Credentials**
   - After creation, go to database "Info" tab
   - Copy the **Internal Database URL** (starts with `postgresql://`)
   - Format: `postgresql://user:password@host:port/database`
   - **IMPORTANT**: Use "Internal Database URL" for better performance

---

### Step 2: Create Web Service

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

2. **Configure Service**
   - **Name**: `everecho-staging-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or `staging`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     npx prisma migrate deploy && node dist/index.js
     ```
   - **Plan**: Free (for staging)

3. **Click "Advanced"** and configure:
   - **Auto-Deploy**: Yes (recommended)
   - **Health Check Path**: `/healthz`

---

### Step 3: Configure Environment Variables

In Render Web Service settings, add these environment variables:

```bash
# Database (CRITICAL - use Internal Database URL from Step 1)
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=3001
NODE_ENV=production

# Blockchain - Base Sepolia
RPC_URL=https://sepolia.base.org
TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
CHAIN_ID=84532

# Event Listener (optional for staging)
ENABLE_EVENT_LISTENER=false
ENABLE_CHAIN_SYNC=true
CHAIN_SYNC_INTERVAL_MS=60000

# CORS (will update after Vercel deployment)
CORS_ORIGIN=https://your-app.vercel.app
```

**⚠️ IMPORTANT NOTES:**

1. **DATABASE_URL**: 
   - Use the **Internal Database URL** from Render PostgreSQL
   - Format: `postgresql://user:password@host:port/database`
   - NOT `file:./dev.db` (that's SQLite for local dev)

2. **CORS_ORIGIN**: 
   - Initially set to `*` or leave blank
   - Update after Vercel deployment with actual URL

3. **ENABLE_EVENT_LISTENER**: 
   - Set to `false` for staging to reduce load
   - Chain sync will handle data consistency

---

### Step 4: Deploy Backend

1. **Click "Create Web Service"**
   - Render will start building and deploying
   - Watch the logs for any errors

2. **Wait for Deployment**
   - First deployment takes 5-10 minutes
   - Prisma migrations will run automatically

3. **Get Backend URL**
   - After deployment, copy the URL
   - Format: `https://everecho-staging-backend.onrender.com`
   - **Save this URL** - you'll need it for frontend

---

### Step 5: Verify Backend Deployment

```bash
# Test health endpoint
curl https://everecho-staging-backend.onrender.com/healthz

# Expected response:
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

**If health check fails**, check Render logs:
- Go to your service → "Logs" tab
- Look for errors related to:
  - Database connection
  - Prisma migrations
  - RPC connection

---

### Step 6: Initialize Database (if needed)

If Prisma migrations didn't run automatically:

1. **Open Render Shell**
   - Go to your service → "Shell" tab
   - Or use Render CLI

2. **Run Migrations Manually**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Verify Database**
   ```bash
   # Check tables exist
   npx prisma studio
   # Or use psql
   psql $DATABASE_URL -c "\dt"
   ```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update CORS in Backend**
   - Before deploying frontend, update backend `CORS_ORIGIN`
   - You can use `*` temporarily, then restrict after deployment

---

### Step 2: Create Vercel Project

1. **Log in to Vercel**
   - Go to https://vercel.com/dashboard

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select your repository

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

### Step 3: Configure Environment Variables

In Vercel project settings → "Environment Variables", add:

```bash
# Backend API (use your Render backend URL)
VITE_BACKEND_BASE_URL=https://everecho-staging-backend.onrender.com

# Network Configuration
VITE_CHAIN_ID=84532

# Contract Addresses - Base Sepolia
VITE_EOCHO_TOKEN_ADDRESS=0xe7940e81dDf4d6415f2947829938f9A24B0ad35d
VITE_REGISTER_ADDRESS=0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151
VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
```

**⚠️ CRITICAL NOTES:**

1. **All frontend env vars MUST start with `VITE_`**
   - Vite only exposes vars with this prefix to the browser
   - Without `VITE_` prefix, vars will be `undefined`

2. **VITE_BACKEND_BASE_URL**:
   - Use your actual Render backend URL
   - NO trailing slash
   - Must be HTTPS (Render provides this automatically)

3. **Environment Selection**:
   - Add these to "Production" environment
   - Optionally add to "Preview" for PR previews

---

### Step 4: Configure Vercel Routing (SPA)

Create `frontend/vercel.json` (if not exists):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Why this is needed:**
- React Router uses client-side routing
- Without rewrites, direct URL access (e.g., `/profile`) returns 404
- This config ensures all routes serve `index.html`

---

### Step 5: Deploy Frontend

1. **Click "Deploy"**
   - Vercel will build and deploy
   - First deployment takes 2-3 minutes

2. **Get Frontend URL**
   - After deployment, copy the URL
   - Format: `https://your-app.vercel.app`
   - Or use custom domain if configured

---

### Step 6: Update Backend CORS

Now that you have the frontend URL:

1. **Go to Render Dashboard**
   - Open your backend service
   - Go to "Environment" tab

2. **Update CORS_ORIGIN**
   ```bash
   CORS_ORIGIN=https://your-app.vercel.app
   ```

3. **Save and Redeploy**
   - Click "Save Changes"
   - Render will automatically redeploy

---

## Post-Deployment Verification

### Verification Checklist

Run through these 3 end-to-end journeys:

---

### Journey 1: Registration Flow

**Objective**: Verify user can register and profile is stored

1. **Open Frontend**
   ```
   https://your-app.vercel.app
   ```

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Connect MetaMask
   - **Switch to Base Sepolia network** (chainId 84532)
   - Verify wallet address displays

3. **Register**
   - Click "Register" or navigate to `/register`
   - Fill in form:
     - Nickname: "Test User"
     - City: "New York"
     - Skills: Add 2-3 skills
     - Contacts: "@testuser" (Telegram)
   - Click "Register"
   - **Confirm transaction in MetaMask**

4. **Verify Registration**
   - Wait for transaction confirmation
   - Should receive 100 EOCHO tokens
   - Should redirect to Profile page
   - Profile should display:
     - Nickname, City, Skills
     - EOCHO balance: 100
     - Stats: Tasks Created (0), Tasks Helped (0)

5. **Backend Verification**
   ```bash
   # Check profile was stored
   curl https://everecho-staging-backend.onrender.com/api/profile/0xYourAddress
   
   # Should return profile data
   ```

**✅ Success Criteria:**
- [ ] Wallet connects successfully
- [ ] Registration transaction confirms
- [ ] Profile displays correctly
- [ ] Backend stores profile data
- [ ] No console errors

---

### Journey 2: Task Creation Flow

**Objective**: Verify task creation and encryption

1. **Navigate to Publish Task**
   - Click "Publish Task" or go to `/publish`

2. **Fill Task Form**
   - Title: "Test Task for Staging"
   - Description: "This is a test task"
   - Category: Select any category
   - Reward: 10 EOCHO
   - Verify contacts preview shows your Telegram

3. **Publish Task**
   - Click "Publish Task"
   - **Approve EOCHO spending** (if first time)
   - **Confirm task creation transaction**

4. **Verify Task Created**
   - Wait for confirmation
   - Should redirect to Task Square
   - Task should appear in list
   - Task card should show:
     - Title, description, category
     - Reward: 10 EOCHO
     - Status: Open
     - Creator nickname

5. **Backend Verification**
   ```bash
   # Check task was stored
   curl https://everecho-staging-backend.onrender.com/api/task/1
   
   # Should return task metadata
   # contactsEncryptedPayload should be present
   ```

6. **Check Profile Stats**
   - Go to Profile page
   - Stats should show: Tasks Created (1)
   - **IMPORTANT**: Stats should display immediately without clicking tabs

**✅ Success Criteria:**
- [ ] Task form submits successfully
- [ ] Transactions confirm on Base Sepolia
- [ ] Task appears in Task Square
- [ ] Backend stores encrypted contacts
- [ ] Profile stats update correctly
- [ ] No console errors

---

### Journey 3: Task Acceptance & Contacts Decryption

**Objective**: Verify helper can accept task and decrypt contacts

1. **Switch to Helper Account**
   - Disconnect current wallet
   - Connect with different MetaMask account
   - Ensure helper account is registered

2. **Find and Accept Task**
   - Go to Task Square
   - Find the test task created earlier
   - Click "Accept Task"
   - **Confirm transaction**

3. **Verify Task Accepted**
   - Task status should change to "In Progress"
   - Task should appear in helper's "Tasks I Helped" tab

4. **View Task Details**
   - Click on the task to view details
   - Should see "View Contacts" button
   - Click "View Contacts"
   - **Sign message in MetaMask** (for decryption)

5. **Verify Contacts Decrypted**
   - Contacts should display: "@testuser"
   - Should match creator's contact info

6. **Backend Verification**
   ```bash
   # Check ContactKey was created
   # (requires database access or admin endpoint)
   ```

**✅ Success Criteria:**
- [ ] Helper can accept task
- [ ] Task status updates correctly
- [ ] Contacts decrypt successfully
- [ ] Decrypted contacts match creator's info
- [ ] No console errors

---

### Additional Verification

#### Check Browser Console

Open DevTools (F12) and verify:
- [ ] No CORS errors
- [ ] No 404 errors for API calls
- [ ] No environment variable undefined warnings
- [ ] Network tab shows successful API calls

#### Check Backend Logs

In Render Dashboard → Logs:
- [ ] No database connection errors
- [ ] No RPC connection errors
- [ ] No Prisma errors
- [ ] API requests logging correctly

#### Check Database

In Render Dashboard → PostgreSQL → Connect:
```sql
-- Check tables exist
\dt

-- Check data
SELECT COUNT(*) FROM "Profile";
SELECT COUNT(*) FROM "Task";
SELECT COUNT(*) FROM "ContactKey";
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Vite Environment Variables Not Working

**Symptom**: `import.meta.env.VITE_BACKEND_BASE_URL` is `undefined`

**Causes**:
1. Environment variable doesn't start with `VITE_`
2. Variable not added to Vercel environment
3. Vercel not redeployed after adding variables

**Solution**:
```bash
# 1. Verify variable name in Vercel
VITE_BACKEND_BASE_URL=https://...  # ✅ Correct
BACKEND_BASE_URL=https://...       # ❌ Wrong - missing VITE_

# 2. Redeploy after adding variables
# Go to Vercel → Deployments → Redeploy
```

---

### Pitfall 2: SPA Routing 404 Errors

**Symptom**: Direct URL access (e.g., `/profile`) returns 404

**Cause**: Vercel doesn't know to serve `index.html` for all routes

**Solution**:
1. Ensure `frontend/vercel.json` exists with rewrites config
2. Redeploy frontend

---

### Pitfall 3: CORS Errors

**Symptom**: Browser console shows CORS errors when calling backend

**Causes**:
1. `CORS_ORIGIN` not set in backend
2. `CORS_ORIGIN` doesn't match frontend URL
3. Frontend using HTTP, backend using HTTPS (or vice versa)

**Solution**:
```bash
# In Render backend environment variables:
CORS_ORIGIN=https://your-app.vercel.app

# NOT:
CORS_ORIGIN=http://your-app.vercel.app  # ❌ Wrong protocol
CORS_ORIGIN=https://your-app.vercel.app/  # ❌ Trailing slash
```

---

### Pitfall 4: Prisma Composite Key Issues

**Symptom**: Database errors related to `chainId_taskId` composite key

**Cause**: Prisma schema uses composite key `@@id([chainId, taskId])`

**Solution**:
1. Ensure migrations ran successfully:
   ```bash
   # In Render Shell
   npx prisma migrate deploy
   ```

2. Verify schema in database:
   ```sql
   \d "Task"
   -- Should show composite primary key on (chainId, taskId)
   ```

3. If migrations failed, check Render logs for errors

---

### Pitfall 5: RPC Connection Failures

**Symptom**: Backend logs show RPC connection errors

**Causes**:
1. Invalid RPC URL
2. Rate limiting on public RPC
3. Network issues

**Solution**:
```bash
# Use reliable RPC providers:

# Option 1: Base Sepolia public RPC
RPC_URL=https://sepolia.base.org

# Option 2: Alchemy (recommended for production)
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Option 3: Infura
RPC_URL=https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID
```

---

### Pitfall 6: Contract Address Mismatch

**Symptom**: Transactions fail or return unexpected data

**Cause**: Frontend and backend using different contract addresses

**Solution**:
1. Verify addresses match in both environments:
   ```bash
   # Frontend (Vercel)
   VITE_TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
   
   # Backend (Render)
   TASK_ESCROW_ADDRESS=0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
   ```

2. Verify addresses are correct for Base Sepolia:
   ```bash
   # Check on BaseScan
   https://sepolia.basescan.org/address/0x9AFBBD83E8B0F4169EDa1bE667BB36a0565cBF28
   ```

---

### Pitfall 7: Database Connection String Format

**Symptom**: Backend fails to connect to PostgreSQL

**Cause**: Wrong DATABASE_URL format or using SQLite format

**Solution**:
```bash
# ✅ Correct (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# ❌ Wrong (SQLite - local dev only)
DATABASE_URL=file:./dev.db

# ❌ Wrong (missing protocol)
DATABASE_URL=user:password@host:port/database
```

---

### Pitfall 8: Render Free Tier Spin-Down

**Symptom**: First request after inactivity takes 30+ seconds

**Cause**: Render free tier spins down after 15 minutes of inactivity

**Solutions**:
1. **Accept it** - This is expected on free tier
2. **Upgrade to paid plan** - Keeps service always running
3. **Use uptime monitor** - Ping service every 10 minutes (e.g., UptimeRobot)

---

### Pitfall 9: Build Command Failures

**Symptom**: Render build fails with Prisma errors

**Cause**: Prisma client not generated before build

**Solution**:
```bash
# Ensure build command includes prisma generate:
npm install && npx prisma generate && npm run build

# NOT just:
npm install && npm run build  # ❌ Missing prisma generate
```

---

### Pitfall 10: Environment Variable Updates Not Applied

**Symptom**: Changed environment variable but app still uses old value

**Cause**: Render/Vercel doesn't automatically redeploy on env changes

**Solution**:
1. After changing environment variables
2. **Manually trigger redeploy**:
   - Render: Click "Manual Deploy" → "Deploy latest commit"
   - Vercel: Go to Deployments → "Redeploy"

---

## Quick Reference

### Backend URLs
```bash
# Health check
https://everecho-staging-backend.onrender.com/healthz

# API endpoints
https://everecho-staging-backend.onrender.com/api/profile
https://everecho-staging-backend.onrender.com/api/task
https://everecho-staging-backend.onrender.com/api/contacts
```

### Frontend URLs
```bash
# Main app
https://your-app.vercel.app

# Key routes
https://your-app.vercel.app/register
https://your-app.vercel.app/publish
https://your-app.vercel.app/profile
https://your-app.vercel.app/tasks
```

### Useful Commands
```bash
# Test backend health
curl https://everecho-staging-backend.onrender.com/healthz

# Test CORS
curl -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://everecho-staging-backend.onrender.com/api/profile

# Check Prisma migrations
npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Local build successful
- [ ] Prisma schema validated
- [ ] Contract addresses confirmed

### Backend (Render)
- [ ] PostgreSQL database created
- [ ] Web service created
- [ ] Environment variables configured
- [ ] Build command correct
- [ ] Start command correct
- [ ] Health check endpoint configured
- [ ] Deployment successful
- [ ] Health check passes
- [ ] Database migrations applied

### Frontend (Vercel)
- [ ] Project imported
- [ ] Root directory set to `frontend`
- [ ] Environment variables configured (all start with `VITE_`)
- [ ] `vercel.json` configured for SPA routing
- [ ] Deployment successful
- [ ] App loads without errors

### Post-Deployment
- [ ] Backend CORS updated with frontend URL
- [ ] Journey 1: Registration flow works
- [ ] Journey 2: Task creation works
- [ ] Journey 3: Task acceptance & decryption works
- [ ] No console errors
- [ ] No CORS errors
- [ ] Backend logs clean
- [ ] Database contains data

---

## Next Steps

After successful staging deployment:

1. **Monitor Performance**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Monitor Render logs for errors
   - Check Vercel analytics

2. **Test with Real Users**
   - Share staging URL with beta testers
   - Collect feedback
   - Monitor for issues

3. **Prepare for Production**
   - Upgrade to paid plans if needed
   - Set up custom domain
   - Configure production environment variables
   - Plan production deployment

---

**Deployment Complete!** 🎉

Your staging environment is now live and ready for testing.

