# Deployment Checklist - Auto-Execute Trading System

## ✅ Pre-Deployment Steps

### 1. Database Migration
- [ ] **Run Supabase Migration**
  - Follow guide in `SUPABASE_MIGRATION_GUIDE.md`
  - Verify all tables and columns created successfully
  - Test queries to confirm schema is correct

### 2. Environment Variables
- [ ] **GitHub Secrets** (already added):
  - `ANGEL_ONE_API_KEY` ✅
  - `ANGEL_ONE_API_SECRET` ✅
  - `ANGEL_ONE_CLIENT_ID` ✅
  - `ANGEL_ONE_PASSWORD` ✅
  - `ANGEL_ONE_TOTP_SECRET` ✅
  - `ANGEL_ONE_PUBLIC_IP` ✅
  - `ANGEL_ONE_LOCAL_IP` ✅
  - `ANGEL_ONE_MAC_ADDRESS` ✅

- [ ] **Add Missing Secret**:
  - `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard → Settings → API → Service Role Key
  - Add to GitHub Secrets

- [ ] **Update `.env.hosting`** (on server):
  - Ensure `VITE_BACKEND_URL=https://api.skyspear.in` (or your backend URL)

### 3. Code Verification
- [ ] **Trading Worker Dependencies**
  - Verify `server/trading-worker/package.json` has:
    - `node-cron`
    - `@supabase/supabase-js`
    - `ws`
  - These will be installed on container startup

- [ ] **Frontend Components**
  - Verify `AutoExecuteDialog.tsx` is updated
  - Verify `AutoExecuteBanner.tsx` exists
  - Verify `StrategyManager.tsx` integrates both components

### 4. Docker Configuration
- [ ] **Verify `docker-compose.yml`**
  - `trading-worker` service mounts code correctly
  - Environment variables are passed via `env_file`
  - Port 4000 is exposed (or mapped correctly)

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: Complete auto-execute trading system with scheduler, market intelligence, and order management"
git push origin main
```

### Step 2: GitHub Actions Deployment
- GitHub Actions will automatically:
  - Build frontend with new components
  - Deploy to AWS EC2
  - Restart Docker containers
  - Install new npm dependencies in trading-worker

### Step 3: Verify Deployment
```bash
# SSH into EC2
ssh -i skyspear.pem ec2-user@98.88.173.81

# Check containers are running
docker ps

# Check trading-worker logs
docker logs nifty-stride-trader-trading-worker-1 -f

# Should see:
# - "trading-worker listening on http://0.0.0.0:4000"
# - "Scheduler: ENABLED"
# - "[Scheduler] Cron jobs initialized successfully"
```

### Step 4: Test Pre-check Endpoint
```bash
# From your local machine or browser
curl -X POST https://api.skyspear.in/precheck \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","strategy":"Short Strangle"}'

# Should return JSON with:
# - success: true
# - vix, niftySpot, availableFunds
# - requiredCapitalPerLot, strikeGap
# - eligible: true/false
```

### Step 5: Test Frontend
1. **Login to Dashboard**
   - Navigate to https://skyspear.in/dashboard
   - Go to "Strategies" tab

2. **Test Auto-Execute Dialog**
   - Click "Enable Auto-Execute" toggle on Short Strangle
   - Verify dialog shows:
     - Live VIX and market conditions
     - Available funds
     - Strike gap calculation
     - Lot selector (try incrementing/decrementing)
     - Daily loss cap
     - Consent checkbox
   - Click "Enable Auto-Execute" after checking consent
   - Verify strategy config is updated in database

3. **Verify Banner**
   - Check that `AutoExecuteBanner` appears at top of Strategies tab
   - Should show:
     - Eligibility status
     - Next entry time
     - Required capital
     - Current VIX

## 🧪 Testing Checklist

### Backend Testing
- [ ] Pre-check endpoint returns correct data
- [ ] Market intelligence API works
- [ ] Scheduler initializes without errors
- [ ] Cron jobs are registered (check logs)

### Frontend Testing
- [ ] Auto-execute dialog loads pre-check data
- [ ] Lot selector works correctly
- [ ] Consent flow works
- [ ] Banner displays status correctly
- [ ] Enable/disable toggle works

### Integration Testing
- [ ] Strategy config saves to database
- [ ] Execution run is created when scheduler triggers
- [ ] Market intelligence recommendations appear
- [ ] Capital calculations are accurate

## 📊 Monitoring

### After Deployment
1. **Monitor Trading Worker Logs**
   ```bash
   docker logs -f nifty-stride-trader-trading-worker-1
   ```

2. **Check Scheduler Execution**
   - At 3:10 PM IST, check logs for entry execution
   - At 3:00 PM IST, check logs for exit execution
   - Verify execution runs are created in database

3. **Monitor Database**
   - Check `execution_runs` table for new entries
   - Verify `strategy_configs` has `auto_execute_enabled = true`
   - Monitor `trades` and `trade_legs` for execution data

## 🔧 Troubleshooting

### Issue: Scheduler not running
- **Check:** `node-cron` is installed
- **Fix:** Verify `npm install` ran in container
- **Verify:** Check logs for "Scheduler: ENABLED"

### Issue: Pre-check fails
- **Check:** Supabase connection (verify `SUPABASE_SERVICE_ROLE_KEY`)
- **Check:** Angel One authentication (verify IP whitelisting)
- **Fix:** Check worker logs for specific error

### Issue: Frontend dialog doesn't load
- **Check:** `VITE_BACKEND_URL` is set correctly
- **Check:** Backend is accessible from frontend
- **Fix:** Verify Caddy routing to trading-worker

### Issue: Database errors
- **Check:** Migration was run successfully
- **Check:** RLS policies allow backend access
- **Fix:** Use Service Role Key for backend operations

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All containers are running
- ✅ Scheduler initializes without errors
- ✅ Pre-check endpoint returns valid data
- ✅ Auto-execute dialog works end-to-end
- ✅ Strategy config saves to database
- ✅ Banner displays correct status
- ✅ No errors in browser console
- ✅ No errors in worker logs

## 📝 Post-Deployment

1. **Monitor First Execution**
   - Wait for 3:10 PM IST
   - Verify entry execution runs
   - Check execution_runs table for new entry
   - Monitor logs for any errors

2. **User Testing**
   - Have users test the auto-execute flow
   - Collect feedback on UI/UX
   - Monitor for any issues

3. **Iterate**
   - Fix any bugs found
   - Enhance based on user feedback
   - Add additional features as needed

