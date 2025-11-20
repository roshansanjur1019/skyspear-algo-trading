# Fix for 502 Error and CORS Issues

## 🔴 Issues Found

1. **502 Bad Gateway**: Server crashing due to `crypto.subtle` usage (Web Crypto API not available in Node.js)
2. **CORS Error**: Missing proper CORS headers in response

## ✅ Fixes Applied

### 1. **Fixed Decryption Function**
- **Problem**: Using `crypto.subtle` (Web Crypto API) which doesn't exist in Node.js
- **Solution**: Replaced with Node.js `crypto` module using `pbkdf2Sync` and `createDecipheriv`
- **File**: `server/trading-worker/index.js` - `decryptCredential` function

### 2. **Enhanced CORS Configuration**
- **Problem**: CORS headers not properly set for preflight requests
- **Solution**: 
  - Moved CORS middleware to top (before bodyParser)
  - Added proper origin checking
  - Added `Access-Control-Allow-Credentials` header
  - Handles OPTIONS preflight requests

### 3. **SDK Method Compatibility**
- **Problem**: SDK method names might differ
- **Solution**: Added fallback checks for `getMarketData` vs `quote` methods

## 🚀 Next Steps

1. **Restart the trading-worker container**:
   ```bash
   docker compose restart trading-worker
   ```

2. **Check logs**:
   ```bash
   docker compose logs trading-worker
   ```

3. **Test the endpoint**:
   - Visit `https://api.skyspear.in/health` - should return `{"ok":true}`
   - Try fetching live data from landing page

## 🔍 If Still Getting 502

Check the container logs for:
- `Decryption error` - means SUPABASE_JWT_SECRET might be missing
- `SDK does not have getMarketData` - means SDK method name issue
- `Authentication failed` - means Angel One credentials issue

## 📝 Environment Variables Required

Make sure these are set in your `.env.hosting` or GitHub Secrets:
- `SUPABASE_JWT_SECRET` - For credential decryption
- `ANGEL_ONE_API_KEY` - For market data
- `ANGEL_ONE_CLIENT_ID` - For authentication
- `ANGEL_ONE_PASSWORD` - For authentication (preferred over MPIN)
- `ANGEL_ONE_TOTP_SECRET` - For TOTP generation

