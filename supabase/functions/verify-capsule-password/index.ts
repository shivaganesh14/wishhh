import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert Uint8Array to hex string
function toHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password using PBKDF2 or legacy formats
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':');
    
    if (parts[0] === 'pbkdf2' && parts.length === 3) {
      // New PBKDF2 format: pbkdf2:salt:hash
      const saltHex = parts[1];
      const expectedHash = parts[2];
      
      // Convert hex salt back to bytes
      const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      
      const encoder = new TextEncoder();
      
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
      
      const computedHash = toHex(new Uint8Array(derivedBits));
      
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
  console.log("verify-capsule-password function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken, password } = await req.json();

    // Validate inputs
    if (!shareToken || !password) {
      return new Response(
        JSON.stringify({ error: "Missing shareToken or password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(shareToken)) {
      return new Response(
        JSON.stringify({ error: "Invalid shareToken format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (password.length < 1 || password.length > 100) {
      return new Response(
        JSON.stringify({ isValid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get stored hash (and capsule data for successful verification)
    const { data: capsule, error: fetchError } = await supabase
      .from("capsules")
      .select("title, content, media_url, media_type, password_hash, unlock_at, open_once, is_opened, created_at")
      .eq("share_token", shareToken)
      .single();

    if (fetchError || !capsule?.password_hash) {
      console.error("Capsule not found or no password:", fetchError);
      return new Response(
        JSON.stringify({ isValid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if capsule is unlocked (time has passed)
    const unlockAt = new Date(capsule.unlock_at);
    if (new Date() < unlockAt) {
      return new Response(
        JSON.stringify({ isValid: false, error: "Capsule is still locked" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce open_once at the server: if already opened, deny
    if (capsule.open_once && capsule.is_opened) {
      return new Response(
        JSON.stringify({ isValid: false, error: "Capsule can only be opened once" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyPassword(password, capsule.password_hash);
    
    console.log("Password verification completed for capsule, valid:", isValid);

    return new Response(
      JSON.stringify({
        isValid,
        // Only return capsule data on success
        capsule: isValid
          ? {
              title: capsule.title,
              content: capsule.content,
              media_url: capsule.media_url,
              media_type: capsule.media_type,
              unlock_at: capsule.unlock_at,
              created_at: capsule.created_at,
              open_once: capsule.open_once,
              is_opened: capsule.is_opened,
              has_password: true,
            }
          : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-capsule-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
