import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate TOTP code
function generateTOTP(secret: string): string {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  
  // Convert counter to 8-byte buffer
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);
  
  // Create HMAC
  const hmac = createHmac('sha1', secret);
  hmac.update(new Uint8Array(buffer));
  const hash = new Uint8Array(hmac.digest());
  
  // Dynamic truncation
  const offset = hash[19] & 0xf;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Authenticate and get session token
async function authenticateAngelOne(
  apiKey: string,
  clientId: string,
  password: string,
  totp: string
): Promise<{ success: boolean; token?: string; feedToken?: string; error?: string }> {
  try {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': apiKey
      },
      body: JSON.stringify({
        clientcode: clientId,
        password: password,
        totp: totp
      })
    });

    const data = await response.json();
    console.log('Angel One auth response:', data);

    if (data.status && data.data) {
      return {
        success: true,
        token: data.data.jwtToken,
        feedToken: data.data.feedToken
      };
    }

    return {
      success: false,
      error: data.message || 'Authentication failed'
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
  clientId: string
): Promise<any> {
  try {
    // Get LTP (Last Traded Price) for NIFTY 50
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getLtpData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': apiKey
      },
      body: JSON.stringify({
        exchange: 'NSE',
        tradingsymbol: 'NIFTY 50',
        symboltoken: '99926000'
      })
    });

    const data = await response.json();
    console.log('Angel One market data response:', data);

    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    // Get environment variables
    const apiKey = Deno.env.get('ANGEL_ONE_API_KEY');
    const apiSecret = Deno.env.get('ANGEL_ONE_API_SECRET');
    const clientId = Deno.env.get('ANGEL_ONE_CLIENT_ID');
    const password = Deno.env.get('ANGEL_ONE_PASSWORD');
    const totpSecret = Deno.env.get('ANGEL_ONE_TOTP_SECRET');

    if (!apiKey || !apiSecret || !clientId || !password || !totpSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing Angel One credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate TOTP
    const totp = generateTOTP(totpSecret);
    console.log('Generated TOTP:', totp);

    // Authenticate
    const authResult = await authenticateAngelOne(apiKey, clientId, password, totp);
    
    if (!authResult.success || !authResult.token) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'authenticate') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Authentication successful',
          token: authResult.token,
          feedToken: authResult.feedToken
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetchMarketData') {
      const marketData = await fetchMarketData(authResult.token, apiKey, clientId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: marketData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in angel-one function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
