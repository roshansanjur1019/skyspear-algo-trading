# Step-by-Step: Configure Load Balancer for api.skyspear.in

## Current Situation
- You have an HTTPS load balancer (`skyspear-url-map`) with backend configured
- You have an HTTP load balancer (`skyspear-url-map-http`) that redirects to HTTPS
- The backend is not showing in the HTTP load balancer (this is normal - it's only on HTTPS)
- You need to route `api.skyspear.in` to the backend

## Solution: Configure Host-Based Routing on HTTPS Load Balancer

### Step 1: Go to HTTPS Load Balancer (Not HTTP)

1. In GCP Console, go to: **Network Services → Load Balancing**
2. Click on **`skyspear-url-map`** (the HTTPS one, NOT the HTTP one)
3. Click **"Edit"** button at the top

### Step 2: Add Host Rule for api.skyspear.in

1. Scroll down to **"Host and path rules"** section
2. Click **"+ ADD HOST RULE"** button
3. In the dialog:
   - **Hosts:** Enter `api.skyspear.in`
   - **Paths:** Leave as `/*` (all paths)
   - **Backend:** Select `skyspear-backend` from dropdown
4. Click **"Save"**

### Step 3: Keep Default Rule for Main Domain

1. Make sure there's still a default rule:
   - **Hosts:** `Any unmatched` or `skyspear.in, www.skyspear.in`
   - **Backend:** `skyspear-backend`
2. This routes the main domain to the backend (which nginx then routes to frontend)

### Step 4: Save Changes

1. Scroll to bottom
2. Click **"Update"** button
3. Wait for update to complete (1-2 minutes)

### Step 5: Verify

1. Go back to load balancer details
2. Check **"Host and path rules"** section
3. You should see:
   - Rule 1: `api.skyspear.in` → `skyspear-backend`
   - Rule 2: `Any unmatched` or `skyspear.in, www.skyspear.in` → `skyspear-backend`

## Alternative: If Backend Not Showing

If `skyspear-backend` doesn't appear in the dropdown:

### Option A: Use Existing Backend from Frontend LB

1. In the **"Host and path rules"** section
2. Click **"+ ADD HOST RULE"**
3. For **"Backend"**, you should see `skyspear-backend` in the dropdown
4. If not, check that the backend service exists:
   - Go to: **Network Services → Load Balancing → Backends**
   - Verify `skyspear-backend` exists and is healthy

### Option B: Create Path Rule Instead

If host rules don't work, use path rules:

1. In **"Host and path rules"** section
2. Click **"+ ADD PATH RULE"**
3. **Paths:** Enter `/api/*` or `/*`
4. **Backend:** Select `skyspear-backend`
5. **Hosts:** Leave empty (applies to all hosts)

## Important Notes

- **HTTP load balancer** (`skyspear-url-map-http`) is just for redirecting HTTP → HTTPS
- **HTTPS load balancer** (`skyspear-url-map`) is where you configure routing
- The backend should be attached to the HTTPS load balancer
- Host-based routing is better than path-based for subdomains

## After Configuration

Test the connection:
```bash
curl https://api.skyspear.in/health
```

Should return: `{"ok":true}`

