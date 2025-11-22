# Fix: Trading-Worker Health Check Failing

## 🔍 Problem

The trading-worker container is failing its health check, causing nginx to fail to start.

**Error:**
```
Container nifty-stride-trader-trading-worker-1  Error
dependency failed to start: container nifty-stride-trader-trading-worker-1 is unhealthy
```

## ✅ Fix Applied

### 1. Increased Health Check Start Period

**Changed:**
- `start_period: 30s` → `start_period: 60s`
- `retries: 3` → `retries: 5`

**Why?**
- Trading-worker needs time to:
  - Initialize Supabase connection
  - Load environment variables
  - Start Express server
  - Initialize schedulers
- 30 seconds might not be enough during cold starts

### 2. Increased Retries

More retries give the container more chances to become healthy.

## 🔧 Manual Fix (If Still Failing)

### Check Trading-Worker Logs

```bash
cd /opt/nifty-stride-trader
docker compose logs trading-worker --tail=50
```

**Look for:**
- Supabase connection errors
- Missing environment variables
- Port binding issues
- Startup errors

### Test Health Endpoint Manually

```bash
# From inside the container
docker compose exec trading-worker curl http://localhost:4000/health

# Should return: {"ok":true,"service":"trading-worker"}
```

### Check Container Status

```bash
docker compose ps trading-worker
```

**Should show:**
- Status: `Up (healthy)` (not `Up (unhealthy)`)

### Increase Start Period Further (If Needed)

If 60s isn't enough, you can increase it:

```yaml
healthcheck:
  start_period: 90s  # Increase to 90 seconds
```

## 📋 Common Causes

1. **Supabase connection slow**
   - First connection can take 10-20 seconds
   - Solution: Increased start_period to 60s

2. **Missing environment variables**
   - Check `.env.angelone` and `.env.hosting` exist
   - Verify all required vars are set

3. **Port already in use**
   - Check if port 4000 is already used
   - Solution: `docker compose down` then `docker compose up -d`

4. **Container startup errors**
   - Check logs for specific errors
   - Fix the underlying issue

## ✅ Verification

After fix, verify:

```bash
# Check all containers are healthy
docker compose ps

# Should show:
# trading-worker: Up (healthy)
# nginx: Up
# frontend: Up
# angel-one: Up
```

## 🎯 Next Steps

1. **Redeploy** with the updated health check settings
2. **Monitor logs** during startup
3. **Verify** all containers become healthy
4. **Test** API endpoints work correctly

