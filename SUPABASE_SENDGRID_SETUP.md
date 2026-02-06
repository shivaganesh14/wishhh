## Goal

Move the app off Lovable’s Supabase (no access) onto **your own Supabase** (free tier) and use **SendGrid** for emails.

This repo already contains:
- Database migrations: `supabase/migrations/`
- Edge Functions: `supabase/functions/`
- Frontend Supabase client: `src/integrations/supabase/client.ts`
- SendGrid email sender already wired in: `supabase/functions/send-capsule-notification/index.ts`

---

## A) Create your Supabase project (you do this in the Supabase dashboard)

1. Create a new Supabase project.
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key**
   - (for functions) **service role key** (keep secret; do not put in frontend)

---

## B) Configure frontend env vars

Edit `.env`:
- `VITE_SUPABASE_URL` = your Project URL
- `VITE_SUPABASE_ANON_KEY` = your anon public key

Then run:

```sh
npm i
npm run dev
```

---

## C) Push the database schema (migrations) to your new project

In a terminal in the project root:

```sh
npm run supabase:login
npm run supabase:link -- --project-ref <YOUR_PROJECT_REF>
npm run supabase:db:push
```

Notes:
- `<YOUR_PROJECT_REF>` is the short ref in your Supabase dashboard URL (not the full URL).

---

## D) Deploy Edge Functions to your new Supabase project

```sh
npm run supabase:functions:deploy
```

---

## E) Add SendGrid + APP_URL secrets to Supabase Edge Functions

In your Supabase dashboard:
- Go to **Edge Functions** → **Secrets**
- Add:
  - `SENDGRID_API_KEY` = your SendGrid API key (Mail Send permission)
  - `SENDGRID_FROM_EMAIL` = your verified sender email
  - `SENDGRID_FROM_NAME` = optional (e.g. `Wishhh`)
  - `APP_URL` = where your frontend is deployed (for links in email)
  - `CRON_SECRET` = optional (only if you trigger via cron header)

Then redeploy functions (or redeploy the `send-capsule-notification` function) so the new secrets are picked up.

---

## E2) Make “unlock” emails actually send (schedule the checker)

**What’s going on:**  
When a capsule’s unlock time has passed, someone needs to run the code that finds those capsules and sends the email. Right now nothing is doing that automatically. You need to add a **scheduled job** that runs every few minutes and calls that code.

You can do it in one of two ways:

---

### Option A – Use the Supabase website (easiest)

Do everything in the Supabase Dashboard in your browser.

1. **Open your project**  
   Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open your Wishhh project.

2. **Open Cron / Jobs**  
   In the left sidebar, click **Integrations**, then **Cron** (or look for **Database** → **Cron** or **Cron Jobs**).  
   If you don’t see it, use the search in the sidebar for “Cron”.

3. **Create a new job**  
   Click **“Create a new cron job”** (or **“New job”** / **“Add job”**).

4. **Choose “HTTP request” or “Invoke Edge Function”**  
   Pick the option that lets you call a URL (HTTP) or an Edge Function.

5. **Fill in the job:**
   - **Name:** e.g. `send-capsule-notification`
   - **Schedule:** `*/5 * * * *` (means “every 5 minutes”)
   - **URL:**  
     `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-capsule-notification`  
     Replace `YOUR_PROJECT_REF` with your project’s short ID (the part in your dashboard URL, e.g. `awmvzvilzybepijldrur`).
   - **Headers:** add one header:
     - Name: `X-Cron-Secret`
     - Value: the **exact same** value you set for `CRON_SECRET` in Edge Functions → send-capsule-notification → Secrets.

6. **Save** the job.  
   After that, every 5 minutes Supabase will call your function, which will find unlocked capsules that haven’t been notified yet and send the emails.

---

### Option B – Use a migration + Vault (for advanced users)

This uses a database migration that schedules the same HTTP call. It only works if you add two secrets to the **Database Vault** first.

1. **Add Edge Function secret**  
   In **Edge Functions** → **Secrets**, set `CRON_SECRET` to any secret string you like (e.g. `my-secret-123`). Remember it.

2. **Add Vault secrets**  
   In the Dashboard go to **Project Settings** → **Vault** (or search “Vault”).  
   Add two secrets (use “New secret” or the SQL below in the **SQL Editor**):

   - Name: `project_url`  
     Value: your Supabase URL, e.g. `https://awmvzvilzybepijldrur.supabase.co`

   - Name: `cron_secret`  
     Value: the **same** value as `CRON_SECRET` (e.g. `my-secret-123`)

   In the **SQL Editor** you can run (replace with your real URL and secret):

   ```sql
   SELECT vault.create_secret('https://awmvzvilzybepijldrur.supabase.co', 'project_url');
   SELECT vault.create_secret('my-secret-123', 'cron_secret');
   ```

3. **Run the migration**  
   In your project folder in the terminal:

   ```sh
   npm run supabase:db:push
   ```

   That applies the migration that creates the cron job. The job will call your Edge Function every 5 minutes.

---

**Summary:**  
- **Option A:** You create one cron job in the Supabase website with a URL and the `X-Cron-Secret` header.  
- **Option B:** You add two Vault secrets, then run `supabase db push` so the migration can schedule the same thing.  
After either option, unlock emails will start sending when capsules pass their unlock time.

---

## F) SendGrid (no domain) checklist

1. SendGrid Dashboard → **Settings → Sender Authentication**
2. Verify **Single Sender**
3. SendGrid Dashboard → **Settings → API Keys**
4. Create API key with **Mail Send** access

---

## G) Important limitation (because you don’t control the old Lovable Supabase)

- You cannot migrate the old data/users unless the old owner exports it for you.
- Expect a “fresh start” database in your new Supabase.

