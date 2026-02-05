import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert Uint8Array to hex string
function toHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// PBKDF2 password hashing with configurable iterations
async function hashPasswordPBKDF2(password: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  
  // Generate salt if not provided
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(saltBytes);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  // Derive key using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new Uint8Array(saltBytes),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  
  const hashHex = toHex(new Uint8Array(derivedBits));
  
  return { hash: `pbkdf2:${saltHex}:${hashHex}`, salt: saltHex };
}

// Verify password against stored hash
async function verifyPasswordPBKDF2(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':');
    
    if (parts[0] === 'pbkdf2' && parts.length === 3) {
      // New PBKDF2 format: pbkdf2:salt:hash
      const saltHex = parts[1];
      const expectedHash = parts[2];
      
      // Convert hex salt back to bytes
      const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      
      const { hash } = await hashPasswordPBKDF2(password, saltBytes);
      const computedHash = hash.split(':')[2]; // Get just the hash part
      
      return computedHash === expectedHash;
    } else if (parts.length === 2) {
      // Legacy SHA-256 format: salt:hash
      const [saltHex, expectedHash] = parts;
      const encoder = new TextEncoder();
      const data = encoder.encode(saltHex + password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashHex = toHex(new Uint8Array(hashBuffer));
      
      return hashHex === expectedHash;
    } else {
      // Very old base64 format
      return btoa(password) === storedHash;
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("hash-capsule-password function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT by getting user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, password, shareToken } = await req.json();

    // Validate password length
    if (!password || password.length < 4 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: "Password must be between 4 and 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "hash") {
      // Generate secure hash for capsule creation
      const { hash } = await hashPasswordPBKDF2(password);
      
      console.log("Password hashed successfully using PBKDF2");
      
      return new Response(
        JSON.stringify({ hash }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "verify" && shareToken) {
      // UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shareToken)) {
        return new Response(
          JSON.stringify({ error: "Invalid shareToken format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get stored hash using service role
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: capsule, error: fetchError } = await adminClient
        .from("capsules")
        .select("password_hash")
        .eq("share_token", shareToken)
        .single();

      if (fetchError || !capsule?.password_hash) {
        return new Response(
          JSON.stringify({ isValid: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyPasswordPBKDF2(password, capsule.password_hash);
      
      console.log("Password verification completed, valid:", isValid);
      
      return new Response(
        JSON.stringify({ isValid }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in hash-capsule-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
