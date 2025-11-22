# Quick Fix: Frontend Can't Connect (SSL Active)

## ✅ Confirmed
- SSL certificates are ACTIVE for all domains
- Load balancer routing is configured
- API works when tested directly

## 🔍 The Problem
Frontend still can't connect - likely the frontend container has wrong URL baked in.

## ✅ Quick Fix: Rebuild Frontend

**SSH into your server and run:**

```bash
cd /opt/nifty-stride-trader

# 1. Verify the backend URL is set correctly
cat .env.hosting | grep VITE_BACKEND_URL
# Should show: VITE_BACKEND_URL=https://api.skyspear.in

# 2. Rebuild frontend with correct URL
docker compose build --no-cache frontend

# 3. Restart frontend
docker compose up -d frontend

# 4. Wait a few seconds for it to start
sleep 5

# 5. Check if frontend is running
docker compose ps frontend
```

## 🔍 Verify in Browser

**After rebuild, in browser:**

1. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Open console (F12)** and check:
   ```javascript
   console.log(import.meta.env.VITE_BACKEND_URL)
   ```
   Should show: `https://api.skyspear.in`

3. **Check Network tab:**
   - Look for requests to `api.skyspear.in`
   - Check if they're using HTTPS
   - Check the exact error

## 🔧 If Still Not Working

### Check 1: Test API from Browser

Open new tab and go to:
```
https://api.skyspear.in/health
```

- ✅ If it works: API is fine, frontend issue
- ❌ If it fails: Different problem

### Check 2: Check Browser Console

Look for:
- **CORS errors** - API working but browser blocking
- **Mixed content** - HTTP site calling HTTPS API
- **Wrong URL** - Frontend using different URL

### Check 3: Check Frontend Logs

```bash
docker compose logs frontend --tail=50
```

Look for any errors during startup.

## 🎯 Most Likely Solution

**Rebuild the frontend container** - this ensures it has the correct `VITE_BACKEND_URL` baked in.

The frontend is built at container build time, so if it was built before the correct URL was set, it will have the wrong URL.

