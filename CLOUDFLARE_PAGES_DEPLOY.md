# Deploy Wishhh to Cloudflare Pages (Free)

Your app will be live 24/7 at a URL like `https://your-project.pages.dev`.

---

## Prerequisites

- Cloudflare account (free): https://dash.cloudflare.com/sign-up  
- Your code in a **GitHub** repository (recommended) **or** you can upload a folder  

---

## Option A: Deploy via GitHub (recommended)

### Step 1: Push your code to GitHub

1. Create a GitHub account if you don’t have one: https://github.com  
2. Create a new repository (e.g. `wishhh`)  
3. In your project folder, run:

```powershell
git init
git add .
git commit -m "Initial commit - Wishhh app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wishhh.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

### Step 2: Create a Cloudflare Pages project

1. Go to: https://dash.cloudflare.com  
2. In the left sidebar, click **Workers & Pages**  
3. Click **Create** → **Pages** → **Connect to Git**  
4. Choose **GitHub** and authorize Cloudflare  
5. Select your repository (e.g. `wishhh`)  
6. Click **Begin setup**  

---

### Step 3: Build settings

Use these values:

| Setting | Value |
|--------|--------|
| **Project name** | `wishhh` (or any name) |
| **Production branch** | `main` |
| **Framework preset** | `None` (or **Vite** if available) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

Then click **Save and Deploy**.

---

### Step 4: Add environment variables

1. In your Pages project, go to **Settings** → **Environment variables**  
2. Add these for **Production** (and optionally Preview):

| Variable name | Value | Encrypt? |
|---------------|--------|----------|
| `VITE_SUPABASE_URL` | `https://awmvzvilzybepijldrur.supabase.co` | No |
| `VITE_SUPABASE_ANON_KEY` | Your anon key from `.env` | No |

To get the anon key: open your `.env` and copy the value of `VITE_SUPABASE_ANON_KEY`.

3. Click **Save**  
4. Go to **Deployments** → open the **⋯** on the latest deployment → **Retry deployment** (so the new env vars are used)  

---

### Step 5: Get your live URL

- After the build finishes, your site will be at:  
  `https://wishhh.pages.dev` (or the project name you chose)  
- Open it and test sign up, sign in, and creating a capsule  

---

## Option B: Deploy by uploading a folder

Use this if you don’t want to use GitHub.

### Step 1: Build locally

```powershell
npm run build
```

This creates a `dist` folder.

---

### Step 2: Create Pages project with direct upload

1. Go to: https://dash.cloudflare.com  
2. **Workers & Pages** → **Create** → **Pages** → **Upload assets**  
3. **Project name**: e.g. `wishhh`  
4. Drag and drop the **contents** of the `dist` folder (not the folder itself), or use **Select from folder** and choose the `dist` folder  
5. Click **Deploy**  

---

### Step 3: Environment variables (direct upload)

With direct upload you **cannot** set env vars in the dashboard. So you must bake them into the build:

1. In your project root, create or edit `.env.production`:

```env
VITE_SUPABASE_URL=https://awmvzvilzybepijldrur.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Run `npm run build` again  
3. Re-upload the new `dist` contents (or create a new deployment and upload)  

**Important:** Don’t commit `.env.production` with real keys to a public repo. Use direct upload only from your own machine, or use GitHub + Cloudflare env vars instead.

---

## After deployment: Supabase and SendGrid

### 1. Supabase Auth redirect URLs

1. Supabase Dashboard → **Authentication** → **URL Configuration**  
2. **Site URL**: set to your Cloudflare URL, e.g. `https://wishhh.pages.dev`  
3. **Redirect URLs**: add `https://wishhh.pages.dev/**`  
4. Save  

### 2. SendGrid (optional)

If you use the capsule notification Edge Function:

1. Supabase Dashboard → **Edge Functions** → **Secrets**  
2. Set **`APP_URL`** to your Cloudflare URL, e.g. `https://wishhh.pages.dev`  
3. Redeploy the `send-capsule-notification` function if needed  

---

## SPA routing (already set up)

The repo includes `public/_redirects` with:

```
/*    /index.html   200
```

So routes like `/dashboard`, `/auth`, `/capsule/xxx` work on Cloudflare Pages. No extra steps needed if you use the provided `public/_redirects`.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Push code to GitHub (or build and upload `dist`) |
| 2 | Create Cloudflare Pages project (Git or direct upload) |
| 3 | Build command: `npm run build`, output: `dist` |
| 4 | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Git method) or use `.env.production` (upload method) |
| 5 | Update Supabase Site URL and Redirect URLs to your `*.pages.dev` URL |
| 6 | Optionally set SendGrid `APP_URL` to the same URL |

After that, your app runs on Cloudflare Pages 24/7.
