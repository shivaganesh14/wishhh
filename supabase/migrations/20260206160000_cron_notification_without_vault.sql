-- Simpler cron setup: no Vault required.
-- Stores cron_secret in a config table. Run this ONCE to set your secret:
--   INSERT INTO public.app_config (key, value) VALUES ('cron_secret', 'YOUR_CRON_SECRET')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- Use the SAME value as Edge Functions → send-capsule-notification → Secrets → CRON_SECRET

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- RLS: only postgres (cron) can read; you insert via SQL Editor (runs as postgres)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Make migration re-runnable
DROP POLICY IF EXISTS "Postgres can manage app_config" ON public.app_config;

CREATE POLICY "Postgres can manage app_config"
  ON public.app_config FOR ALL
  USING (current_user = 'postgres')
  WITH CHECK (current_user = 'postgres');

-- Replace invoke_capsule_notification to read from app_config instead of Vault
CREATE OR REPLACE FUNCTION public.invoke_capsule_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_url text := 'https://awmvzvilzybepijldrur.supabase.co';
BEGIN
  SELECT value INTO v_secret FROM public.app_config WHERE key = 'cron_secret' LIMIT 1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'app_config.cron_secret not set. Run: INSERT INTO public.app_config (key, value) VALUES (''cron_secret'', ''your-secret'');';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-capsule-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END;
$$;

-- Ensure cron runs every minute
SELECT cron.schedule(
  'send-capsule-notification',
  '* * * * *',
  $$SELECT public.invoke_capsule_notification();$$
);
