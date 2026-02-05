# Wishhh

Vite + React + TypeScript app using Supabase (DB, Storage, Edge Functions).

## Local development

```sh
npm i
npm run dev
```

## Environment variables (frontend)

Set these in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (recommended) or `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy)

## Supabase (your own project)

1. Create a free Supabase project.
2. In Supabase dashboard, copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`
3. Apply the SQL in `supabase/migrations/` to your new project (or use the Supabase CLI if you already have it set up).

## Email (SendGrid)

This project uses a Supabase Edge Function at `supabase/functions/send-capsule-notification`.

Configure these **Function secrets** in your Supabase project:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SENDGRID_FROM_NAME` (optional)
- `APP_URL` (your deployed site URL, e.g. `https://yourdomain.com`)
- `CRON_SECRET` (optional, for scheduled invocations)
