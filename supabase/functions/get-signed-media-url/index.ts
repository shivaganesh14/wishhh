import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("get-signed-media-url function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken, mediaPath } = await req.json();

    // Validate inputs
    if (!shareToken || !mediaPath) {
      return new Response(
        JSON.stringify({ error: "Missing shareToken or mediaPath" }),
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the capsule exists, is unlocked, and the media path matches
    const { data: capsule, error: fetchError } = await supabase
      .from("capsules")
      .select("id, unlock_at, media_url")
      .eq("share_token", shareToken)
      .single();

    if (fetchError || !capsule) {
      console.error("Capsule not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Capsule not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if capsule is unlocked (time has passed)
    const unlockAt = new Date(capsule.unlock_at);
    if (new Date() < unlockAt) {
      return new Response(
        JSON.stringify({ error: "Capsule is still locked" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the file path from the stored URL
    // The media_url stored in the database is the full public URL
    // We need to extract just the path portion for creating signed URLs
    const storedUrl = capsule.media_url;
    if (!storedUrl) {
      return new Response(
        JSON.stringify({ error: "No media attached to this capsule" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that the requested path matches what's stored
    // This prevents accessing arbitrary files
    if (!storedUrl.includes(mediaPath)) {
      console.error("Media path mismatch:", { storedUrl, mediaPath });
      return new Response(
        JSON.stringify({ error: "Media path mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a signed URL with 1 hour expiry
    const { data, error } = await supabase.storage
      .from("capsule-media")
      .createSignedUrl(mediaPath, 3600); // 1 hour

    if (error) {
      console.error("Error creating signed URL:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signed URL generated successfully for capsule:", capsule.id);

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-signed-media-url function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
