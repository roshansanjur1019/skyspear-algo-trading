import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using Web Crypto API with a project-specific key
async function encryptCredential(credential: string): Promise<string> {
  if (!credential || credential.trim().length === 0) {
    throw new Error('Cannot encrypt empty credential');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(credential);
  
  // Use a key derived from JWT secret for encryption
  // Note: Secret name cannot start with "SUPABASE_" prefix (Supabase restriction)
  const jwtSecret = Deno.env.get('JWT_SECRET') || Deno.env.get('BROKER_ENCRYPTION_SECRET') || '';
  if (!jwtSecret || jwtSecret.length === 0) {
    throw new Error('JWT_SECRET or BROKER_ENCRYPTION_SECRET environment variable is not set. Please configure it in Supabase Edge Function settings.');
  }
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(jwtSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('skyspear-broker-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { apiKey, apiSecret, brokerType, clientId, mpin, totpSecret, publicIp, localIp, macAddress } = await req.json();

    // Validate inputs
    if (!apiKey || !apiSecret || !brokerType) {
      throw new Error('Missing required fields: apiKey, apiSecret, or brokerType');
    }

    if (!['zerodha', 'angel_one'].includes(brokerType)) {
      throw new Error('Invalid broker type');
    }

    // Angel One API keys can be shorter (8+ chars), Zerodha keys are typically longer
    // Allow minimum 5 characters to accommodate both
    if (apiKey.length < 5 || apiKey.length > 200) {
      throw new Error('Invalid API key length (must be 5-200 characters)');
    }

    if (apiSecret.length < 5 || apiSecret.length > 200) {
      throw new Error('Invalid API secret length (must be 5-200 characters)');
    }

    // For Angel One, validate additional required fields
    if (brokerType === 'angel_one') {
      if (!clientId || !mpin || !totpSecret) {
        throw new Error('Angel One requires: clientId, mpin, and totpSecret');
      }
      if (clientId.length < 5 || clientId.length > 50) {
        throw new Error('Invalid Client ID length');
      }
      if (mpin.length !== 4) {
        throw new Error('MPIN must be 4 digits');
      }
      if (totpSecret.length < 10) {
        throw new Error('Invalid TOTP secret length');
      }
    }

    console.log('Encrypting credentials for user:', user.id, 'broker:', brokerType);

    // Encrypt credentials
    const encryptedApiKey = await encryptCredential(apiKey);
    const encryptedApiSecret = await encryptCredential(apiSecret);
    
    // For Angel One, encrypt additional fields
    let encryptedClientId = null;
    let encryptedMpin = null;
    let encryptedTotpSecret = null;
    
    if (brokerType === 'angel_one') {
      encryptedClientId = await encryptCredential(clientId);
      encryptedMpin = await encryptCredential(mpin);
      encryptedTotpSecret = await encryptCredential(totpSecret);
    }

    // Store encrypted credentials
    const insertData: any = {
      user_id: user.id,
      broker_type: brokerType,
      api_key_encrypted: encryptedApiKey,
      api_secret_encrypted: encryptedApiSecret,
      is_active: true,
      last_connected_at: new Date().toISOString(),
    };

    // Add Angel One specific fields
    if (brokerType === 'angel_one') {
      insertData.client_id_encrypted = encryptedClientId;
      insertData.mpin_encrypted = encryptedMpin;
      insertData.totp_secret_encrypted = encryptedTotpSecret;
      // Store IP info for reference (all users use same server IP)
      // Public IP should be provided by client or use environment variable
      // No hardcoded fallback - must be explicitly set
      insertData.public_ip = publicIp || Deno.env.get('ANGEL_ONE_PUBLIC_IP') || '';
      insertData.local_ip = localIp || null;
      insertData.mac_address = macAddress || null;
    }

    const { data, error } = await supabase
      .from('broker_accounts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to store credentials: ${error.message}`);
    }

    console.log('Credentials stored successfully');

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error storing broker credentials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return more detailed error information
    const statusCode = errorMessage.includes('Unauthorized') ? 401 : 
                      errorMessage.includes('Missing') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
