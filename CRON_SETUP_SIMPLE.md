# Fix "No valid authentication provided" – Simple Setup

Your site: **https://wishhhh.vercel.app**

## Run this ONCE in SQL Editor

In **Supabase Dashboard** → **SQL Editor**, paste and run this **entire** script. It creates the table, the cron job, and inserts your cron secret.

**Before you run it:** replace `your-cron-secret-here` with a secret you choose (e.g. `wishhh-unlock-2026`). You’ll use the **same** value in Edge Functions in Step 2.

```sql
-- 1. Create config table
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Postgres can manage app_config" ON public.app_config;
CREATE POLICY "Postgres can manage app_config"
  ON public.app_config FOR ALL
  USING (current_user = 'postgres')
  WITH CHECK (current_user = 'postgres');

-- 2. Insert cron secret (replace your-cron-secret-here with your real secret)
INSERT INTO public.app_config (key, value) 
VALUES ('cron_secret', 'your-cron-secret-here')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Function that calls the Edge Function
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
    RAISE WARNING 'app_config.cron_secret not set.';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-capsule-notification',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Cron-Secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END;
$$;

-- 4. Run every minute
SELECT cron.schedule(
  'send-capsule-notification',
  '* * * * *',
  $$SELECT public.invoke_capsule_notification();$$
);
```

## Step 2: Set the same secret in Edge Functions

In **Supabase** → **Edge Functions** → **send-capsule-notification** → **Secrets**:

- **CRON_SECRET** = the **exact same** value you used in the script above (e.g. `wishhh-unlock-2026`)

## Step 3: Set APP_URL for email links

In **Supabase** → **Edge Functions** → **send-capsule-notification** → **Secrets**:

- **APP_URL** = `https://wishhhh.vercel.app`

---

After the script and Step 2, the cron will authenticate and unlock emails will send. Step 3 makes the button in the email point to wishhhh.vercel.app.
