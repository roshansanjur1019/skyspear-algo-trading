# AWS to GCP Migration Checklist

## ✅ What You've Already Done

1. ✅ Deployed new GCP instance
2. ✅ Added public IP to SmartAPI dashboard
3. ✅ Updated DNS records (A records for skyspear.in, www.skyspear.in, api.skyspear.in)
4. ✅ Updated GitHub Secrets:
   - `ANGEL_ONE_PUBLIC_IP` → GCP static public IP
   - `ANGEL_ONE_LOCAL_IP` → GCP private IP

## 📋 Additional Places to Update

### 1. **GitHub Secrets** (Verify these are correct)

Check that these secrets are updated:
- ✅ `ANGEL_ONE_PUBLIC_IP` → GCP static public IP (e.g., `34.180.17.77`)
- ✅ `ANGEL_ONE_LOCAL_IP` → GCP private IP (e.g., `10.146.0.2`)
- ✅ `SSH_HOST` → GCP instance external IP or hostname
- ✅ `SSH_USER` → GCP instance username (usually your GCP username)
- ✅ `SSH_PRIVATE_KEY` → GCP SSH private key (if using SSH keys)
- ✅ `SSH_PORT` → Usually `22` (verify if different)

### 2. **Code Files with Hardcoded IPs** (Need Updates)

#### File: `server/trading-worker/index.js`
**Line 67-68:** Hardcoded fallback IPs
```javascript
const SERVER_PUBLIC_IP = process.env.ANGEL_ONE_PUBLIC_IP || '98.88.173.81'  // ← Update fallback
const SERVER_LOCAL_IP = process.env.ANGEL_ONE_LOCAL_IP || '172.31.26.44'   // ← Update fallback
```

#### File: `src/components/dashboard/BrokerIntegration.tsx`
**Line 171:** Hardcoded public IP
```typescript
requestBody.publicIp = '98.88.173.81';  // ← Update to GCP IP or use env var
```

#### File: `supabase/functions/store-broker-credentials/index.ts`
**Line 160:** Hardcoded fallback IP
```typescript
insertData.public_ip = publicIp || '98.88.173.81';  // ← Update fallback
```

#### File: `supabase/functions/angel-one/index.ts`
**Line 230-231:** Hardcoded fallback IPs
```typescript
const publicIp = Deno.env.get('ANGEL_ONE_PUBLIC_IP') || '98.88.173.81';  // ← Update fallback
const localIp = Deno.env.get('ANGEL_ONE_LOCAL_IP') || '172.31.26.44';   // ← Update fallback
```

### 3. **Deployment Workflow** (`.github/workflows/deploy.yml`)

**Line 1:** Update job name (optional but recommended)
```yaml
name: Deploy to GCP Instance  # ← Change from "AWS Instance"
```

**Verify SSH connection:**
- `SSH_HOST` should point to GCP instance
- `SSH_USER` should be your GCP username
- `SSH_PRIVATE_KEY` should be GCP SSH key

### 4. **GCP Instance Setup** (On the server)

After deployment, verify on GCP instance:
```bash
# Check if .env files are created correctly
cat ~/apps/nifty-stride-trader/.env.angelone
cat ~/apps/nifty-stride-trader/.env.hosting

# Verify IPs are correct
grep ANGEL_ONE_PUBLIC_IP ~/apps/nifty-stride-trader/.env.angelone
grep ANGEL_ONE_LOCAL_IP ~/apps/nifty-stride-trader/.env.angelone

# Check containers are running
docker compose ps

# Check logs
docker compose logs trading-worker
```

### 5. **Firewall Rules** (GCP Console)

Ensure these ports are open in GCP Firewall:
- ✅ Port 80 (HTTP)
- ✅ Port 443 (HTTPS)
- ✅ Port 22 (SSH)
- ✅ Port 4000 (Trading Worker - internal, not exposed)
- ✅ Port 3000 (Frontend - internal, not exposed)

### 6. **DNS Propagation** (Verify)

After updating DNS records, verify propagation:
```bash
# Check DNS records
dig skyspear.in A
dig www.skyspear.in A
dig api.skyspear.in A

# Should all point to: 34.180.17.77 (your GCP IP)
```

### 7. **SmartAPI App Configuration**

Verify in SmartAPI dashboard:
- ✅ Primary Static IP: `34.180.17.77` (GCP static IP)
- ✅ Secondary Static IP: (optional, can leave blank)
- ✅ Redirect URL: `https://skyspear.in/smartapi/callback`
- ✅ Postback URL: `https://skyspear.in/smartapi/callback`

### 8. **MAC Address** (If Required)

If you need to update MAC address:
- Get GCP instance MAC address
- Update `ANGEL_ONE_MAC_ADDRESS` in GitHub Secrets
- Or leave as default: `fe:ed:fa:ce:be:ef` (if not strictly validated)

## 🔧 Updates Applied

I've updated all hardcoded IPs in the codebase:

1. ✅ `server/trading-worker/index.js` - Removed hardcoded AWS IPs, now uses env vars
2. ✅ `src/components/dashboard/BrokerIntegration.tsx` - Removed hardcoded IP, backend handles it
3. ✅ `supabase/functions/store-broker-credentials/index.ts` - Uses env var, no hardcoded fallback
4. ✅ `supabase/functions/angel-one/index.ts` - Uses env var, no hardcoded fallback
5. ✅ `.github/workflows/deploy.yml` - Updated job name to "Deploy to GCP Instance"

## ✅ Final Verification Steps

### 1. **Verify GitHub Secrets**
```bash
# In GitHub: Settings → Secrets and variables → Actions
# Verify these are set:
- ANGEL_ONE_PUBLIC_IP = 34.180.17.77 (your GCP static IP)
- ANGEL_ONE_LOCAL_IP = <your GCP private IP>
- SSH_HOST = <GCP instance external IP>
- SSH_USER = <GCP username>
- SSH_PRIVATE_KEY = <GCP SSH key>
- SSH_PORT = 22
```

### 2. **Verify DNS Records**
```bash
# Check DNS propagation
dig skyspear.in A
dig www.skyspear.in A  
dig api.skyspear.in A

# All should return: 34.180.17.77
```

### 3. **Verify SmartAPI Configuration**
- Primary Static IP: `34.180.17.77`
- Redirect URL: `https://skyspear.in/smartapi/callback`
- Postback URL: `https://skyspear.in/smartapi/callback`

### 4. **Deploy and Test**
```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Migrate from AWS to GCP - remove hardcoded IPs"
git push origin main

# After deployment, verify on GCP instance:
ssh <user>@<gcp-ip>
cd ~/apps/nifty-stride-trader
cat .env.angelone | grep ANGEL_ONE_PUBLIC_IP
docker compose logs trading-worker
```

### 5. **Test Broker Connection**
1. Go to Dashboard → Broker Integration
2. Try connecting Angel One
3. Verify it uses the new GCP IP (34.180.17.77)
4. Check logs for any IP-related errors

## 🎯 Summary

**What's Done:**
- ✅ All hardcoded AWS IPs removed
- ✅ Code now uses environment variables
- ✅ Deployment workflow updated
- ✅ Frontend no longer sends hardcoded IP

**What You Need to Do:**
- ✅ Verify GitHub Secrets are correct
- ✅ Verify DNS records point to GCP IP
- ✅ Verify SmartAPI has GCP IP whitelisted
- ✅ Deploy and test

**No More Hardcoded IPs!** 🎉

