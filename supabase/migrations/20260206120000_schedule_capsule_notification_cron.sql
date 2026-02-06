-- Schedule send-capsule-notification Edge Function so unlock emails are sent.
-- Requires vault secrets: project_url (e.g. https://xxx.supabase.co), cron_secret (same as CRON_SECRET in Edge Function env).
-- Add them in Dashboard: Project Settings → Vault, or run:
--   SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
--   SELECT vault.create_secret('your-cron-secret', 'cron_secret');

CREATE OR REPLACE FUNCTION public.invoke_capsule_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;

  IF v_url IS NULL THEN
    RAISE WARNING 'Vault secret project_url not set; capsule notification cron will not run. Add it in Dashboard → Project Settings → Vault.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-capsule-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', COALESCE(v_secret, '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END;
$$;

-- Run every 5 minutes so unlocked capsules get notifications shortly after unlock time
SELECT cron.schedule(
  'send-capsule-notification',
  '*/5 * * * *',
  $$SELECT public.invoke_capsule_notification();$$
);
