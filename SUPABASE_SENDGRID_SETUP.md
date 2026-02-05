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

## F) SendGrid (no domain) checklist

1. SendGrid Dashboard → **Settings → Sender Authentication**
2. Verify **Single Sender**
3. SendGrid Dashboard → **Settings → API Keys**
4. Create API key with **Mail Send** access

---

## G) Important limitation (because you don’t control the old Lovable Supabase)

- You cannot migrate the old data/users unless the old owner exports it for you.
- Expect a “fresh start” database in your new Supabase.

