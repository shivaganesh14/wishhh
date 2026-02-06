# How to send unlock emails (simple guide)

When a time capsule’s unlock time has passed, the app can email the recipient. For that to happen, Supabase must **run the notification code every few minutes**. Right now nothing is doing that, so no emails are sent.

You fix it by adding a **scheduled job** that runs every 5 minutes. Here’s the easiest way.

---

## Step 1: Set a secret for the notification function

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Edge Functions** in the left menu.
3. Open **send-capsule-notification** (or the list of functions and click it).
4. Go to **Secrets** (or **Environment variables**).
5. Add a secret:
   - **Name:** `CRON_SECRET`
   - **Value:** any password you choose (e.g. `my-unlock-secret-456`)
6. Remember this value; you’ll use it in the next step.

---

## Step 2: Create a cron job that runs every 5 minutes

1. In the same Supabase project, in the left menu click **Integrations**.
2. Click **Cron** (or look for **Cron jobs** / **Scheduled jobs**).
3. Click **Create a new cron job** (or **New job**).
4. Fill in:
   - **Name:** `send-capsule-notification` (or anything you like)
   - **Schedule:** `*/5 * * * *`  
     (This means “every 5 minutes”.)
   - **Type:** choose **HTTP request** or **Invoke Edge Function** (whatever your dashboard offers).
   - **URL:**  
     `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-capsule-notification`  
     Replace **YOUR_PROJECT_REF** with your project ID (e.g. from the dashboard URL: `awmvzvilzybepijldrur` → so the URL becomes `https://awmvzvilzybepijldrur.supabase.co/functions/v1/send-capsule-notification`).
   - **Headers:** add one header:
     - **Name:** `X-Cron-Secret`
     - **Value:** the same value you set for `CRON_SECRET` in Step 1 (e.g. `my-unlock-secret-456`).
5. Save the job.

---

## Done

After you save, Supabase will call your notification function every 5 minutes. That function will:

- Find capsules whose unlock time has already passed and whose notification email hasn’t been sent yet.
- Send the email to the recipient.
- Mark that capsule as “notification sent”.

So when a capsule unlocks, the recipient should get the email within about 5 minutes.

---

## If you don’t see “Cron” or “Integrations”

- Try **Database** in the left menu, then look for **Cron** or **Extensions** (pg_cron).
- Or use the search box in the Supabase Dashboard and search for **cron**.
- If your plan doesn’t include cron, you may need to use the “Option B” (migration + Vault) described in **SUPABASE_SENDGRID_SETUP.md** under section **E2**.
