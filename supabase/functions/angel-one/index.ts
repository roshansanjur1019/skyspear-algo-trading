import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base32 decode (RFC 4648)
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.replace(/=+$/,'').replace(/\s+/g,'').toUpperCase();
  let bits = '';
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue; // ignore unknown chars/spaces
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

// Generate TOTP code
async function generateTOTP(secret: string): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  
  // Convert counter to 8-byte buffer (big-endian)
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);
  
  // Decode base32 secret to raw bytes
  const keyBytes = base32ToBytes(secret);

  // Generate TOTP using Web Crypto API
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const hash = new Uint8Array(signature);
  
  // Dynamic truncation (use last nibble as offset)
  const offset = hash[hash.length - 1] & 0xf;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Authenticate and get session token using MPIN
async function authenticateAngelOne(
  apiKey: string,
  clientId: string,
  mpin: string,
  totp: string,
  clientPublicIp: string,
  clientLocalIp: string,
  macAddress: string,
): Promise<{ success: boolean; token?: string; feedToken?: string; error?: string }> {
  try {
    console.log('=== Angel One Authentication Attempt ===');
    console.log('Public IP:', clientPublicIp);
    console.log('Local IP:', clientLocalIp);
    console.log('MAC Address:', macAddress);
    console.log('Client ID:', clientId);
    console.log('TOTP:', totp);
    console.log('=======================================');
    
    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByMpin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': clientLocalIp,
        'X-ClientPublicIP': clientPublicIp,
        'X-MACAddress': macAddress,
        'X-PrivateKey': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        clientcode: clientId,
        mpin: mpin,
        totp: totp
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      return {
        success: false,
        error: `API returned non-JSON response. Status: ${response.status}. This might indicate an API endpoint issue or blocked request.`
      };
    }

    const data = await response.json();
    console.log('Angel One auth response (loginByMpin):', data);

    if (data?.status && data?.data) {
      return {
        success: true,
        token: data.data.jwtToken,
        feedToken: data.data.feedToken
      };
    }

    return {
      success: false,
      error: data?.message || 'Authentication failed'
    };
  } catch (error) {
    console.error('Angel One authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Fetch market data
async function fetchMarketData(
  token: string,
  apiKey: string,
  clientId: string,
  clientPublicIp: string,
  clientLocalIp: string,
  macAddress: string,
  options?: { mode?: string; exchangeTokens?: Record<string, string[]> }
): Promise<any> {
  try {
    const mode = options?.mode || 'LTP';
    const exchangeTokens = options?.exchangeTokens || { NSE: ['99926000','99926009','99926037','99926017'], BSE: ['99919000'] };
    
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': clientLocalIp,
        'X-ClientPublicIP': clientPublicIp,
        'X-MACAddress': macAddress,
        'X-PrivateKey': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ mode, exchangeTokens })
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON market data response:', text.substring(0, 500));
      return { status: false, message: 'Non-JSON response', raw: text };
    }
    const data = await response.json();
    console.log('Angel One market data response:', data);

    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let action: string | undefined;
  let reqBody: any = undefined;
  try {
    reqBody = await req.json();
    action = reqBody?.action;
  } catch (_) {
    action = undefined;
  }

  if (req.method === 'GET' && !action) {
    return new Response(JSON.stringify({ success: true, message: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!action) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('ANGEL_ONE_API_KEY');
    const apiSecret = Deno.env.get('ANGEL_ONE_API_SECRET');
    const clientId = Deno.env.get('ANGEL_ONE_CLIENT_ID');
    const mpin = Deno.env.get('ANGEL_ONE_PASSWORD');
    const totpSecret = Deno.env.get('ANGEL_ONE_TOTP_SECRET');

    if (!apiKey || !apiSecret || !clientId || !mpin || !totpSecret) {
      return new Response(JSON.stringify({ error: 'Missing Angel One credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const forwarded = req.headers.get('x-forwarded-for') || '';
    const forwardedIp = forwarded.split(',')[0]?.trim();
    
    // Use explicit IPs with proper defaults
    // IPs should be provided via environment variables or request body
    // No hardcoded fallbacks - must be explicitly configured
    const publicIp = Deno.env.get('ANGEL_ONE_PUBLIC_IP') || '';
    const localIp = Deno.env.get('ANGEL_ONE_LOCAL_IP') || '';
    const macAddress = Deno.env.get('ANGEL_ONE_MAC_ADDRESS') || 'fe:ed:fa:ce:be:ef';

    console.log('=== Starting authentication with IPs ===');
    console.log('Public IP (to be used):', publicIp);
    console.log('Local IP (to be used):', localIp);
    console.log('MAC Address (to be used):', macAddress);
    console.log('========================================');

    const totp = await generateTOTP(totpSecret);
    const authResult = await authenticateAngelOne(apiKey, clientId, mpin, totp, publicIp, localIp, macAddress);

    if (!authResult.success || !authResult.token) {
      return new Response(JSON.stringify({ error: authResult.error || 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'authenticate') {
      return new Response(JSON.stringify({ success: true, message: 'Authentication successful', token: authResult.token, feedToken: authResult.feedToken }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetchMarketData') {
      const marketData = await fetchMarketData(
        authResult.token, 
        apiKey, 
        clientId,
        publicIp,
        localIp,
        macAddress,
        {
          mode: reqBody?.mode,
          exchangeTokens: reqBody?.exchangeTokens,
        }
      );
      return new Response(JSON.stringify({ success: true, data: marketData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in angel-one function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});