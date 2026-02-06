import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL");
const SENDGRID_FROM_NAME = Deno.env.get("SENDGRID_FROM_NAME") || "Wishhh";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Capsule {
  id: string;
  title: string;
  recipient_email: string;
  share_token: string;
  unlock_at: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY) {
    throw new Error("Missing SENDGRID_API_KEY");
  }
  if (!SENDGRID_FROM_EMAIL) {
    throw new Error("Missing SENDGRID_FROM_EMAIL");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  // SendGrid returns 202 Accepted with an empty body on success
  if (response.status !== 202) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to send email (status ${response.status}): ${errorText}`);
  }
  return { ok: true };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-capsule-notification function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization - require either a valid cron secret or authenticated user
    const authHeader = req.headers.get('Authorization');
    const cronSecretHeader = (req.headers.get('X-Cron-Secret') ?? req.headers.get('x-cron-secret'))?.trim();

    // Check cron secret for scheduled invocations
    if (CRON_SECRET && cronSecretHeader && cronSecretHeader === CRON_SECRET.trim()) {
      console.log("Authenticated via cron secret");
    } else if (authHeader?.startsWith('Bearer ')) {
      // Verify JWT for manual invocations
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      
      if (authError || !user) {
        console.error("Invalid JWT token");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Authenticated via JWT, user:", user.id);
    } else {
      console.error("No valid authentication provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find capsules that are unlocked but notification not sent
    const now = new Date().toISOString();
    
    const { data: capsules, error: fetchError } = await supabase
      .from("capsules")
      .select("id, title, recipient_email, share_token, unlock_at")
      .lte("unlock_at", now)
      .eq("notification_sent", false)
      .not("recipient_email", "is", null);

    if (fetchError) {
      console.error("Error fetching capsules:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${capsules?.length || 0} capsules to notify`);

    if (!capsules || capsules.length === 0) {
      return new Response(
        JSON.stringify({ message: "No capsules to notify", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const capsule of capsules as Capsule[]) {
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(capsule.recipient_email)) {
          console.error(`Invalid email format for capsule ${capsule.id}: ${capsule.recipient_email}`);
          results.failed.push(capsule.id);
          continue;
        }
        
        // Base URL of your deployed web app (set APP_URL in Supabase Function env)
        const appUrl = Deno.env.get("APP_URL") || "http://localhost:8080";
        const viewUrl = `${appUrl}/capsule/${capsule.share_token}`;

        console.log(`Sending notification for capsule ${capsule.id} to ${capsule.recipient_email}`);

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Time Capsule Unlocked!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 18px; margin-top: 0;">Someone has created a special time capsule for you!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
                <h2 style="margin: 0 0 10px 0; color: #374151;">"${capsule.title}"</h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Scheduled to unlock: ${new Date(capsule.unlock_at).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${viewUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Open Your Time Capsule
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${viewUrl}" style="color: #667eea; word-break: break-all;">${viewUrl}</a>
              </p>
            </div>
            
            <div style="background: #374151; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                This email was sent by Wishhh. If you didn't expect this, you can safely ignore it.
              </p>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await sendEmail(
          capsule.recipient_email,
          `🎁 A Time Capsule Has Been Unlocked: "${capsule.title}"`,
          emailHtml
        );

        console.log(`Email sent successfully for capsule ${capsule.id}:`, emailResponse);

        // Mark notification as sent
        const { error: updateError } = await supabase
          .from("capsules")
          .update({ notification_sent: true })
          .eq("id", capsule.id);

        if (updateError) {
          console.error(`Failed to update notification_sent for capsule ${capsule.id}:`, updateError);
        }

        results.success.push(capsule.id);
      } catch (emailError) {
        console.error(`Failed to send email for capsule ${capsule.id}:`, emailError);
        results.failed.push(capsule.id);
      }
    }

    console.log("Notification results:", results);

    return new Response(
      JSON.stringify({ 
        message: "Notifications processed", 
        success: results.success.length,
        failed: results.failed.length,
        details: results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-capsule-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
