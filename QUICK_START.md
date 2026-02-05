# 🚀 Quick Start Guide - How to Run Your Project

## Prerequisites

- ✅ Node.js installed (v18 or higher)
- ✅ npm installed (comes with Node.js)
- ✅ Your Supabase project created (`awmvzvilzybepijldrur`)
- ✅ `.env` file configured (already done ✅)

---

## Step 1: Install Dependencies

Open PowerShell in your project folder and run:

```powershell
npm install
```

**Expected**: Should install all packages (takes 1-2 minutes)

**If you see errors**: Make sure you're in the project root folder (`wishhh-0521dec4-main`)

---

## Step 2: Run Database Migrations (IMPORTANT!)

**You MUST do this before running the app**, otherwise sign-in won't work!

```powershell
# Login to Supabase (opens browser)
npm run supabase:login

# Link to your project
npm run supabase:link -- --project-ref awmvzvilzybepijldrur

# Push database migrations (creates tables)
npm run supabase:db:push
```

**Expected output**: Should show "Applied migration..." messages

**If you see errors**:
- Make sure you're logged in to Supabase
- Check your project ref is correct: `awmvzvilzybepijldrur`

---

## Step 3: Deploy Edge Functions (Optional but Recommended)

Deploy the functions needed for capsules and emails:

```powershell
npm run supabase:functions:deploy
```

**Expected output**: Should show "Deployed Functions..." messages

---

## Step 4: Start the Development Server

```powershell
npm run dev
```

**Expected output**:
```
  VITE v5.4.19  ready in 500 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

---

## Step 5: Open Your Browser

1. Open your browser (Chrome, Edge, Firefox)
2. Go to: **http://localhost:8080**
3. You should see your Wishhh homepage! 🎉

---

## ✅ Quick Test Checklist

After the app is running:

- [ ] **Homepage loads** → Should see Wishhh landing page
- [ ] **Sign Up works** → Create a test account
- [ ] **Sign In works** → Login with your test account
- [ ] **Dashboard loads** → Should see your dashboard after login
- [ ] **Create Capsule works** → Try creating a time capsule

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Fix**: 
1. Check `.env` file exists in project root
2. Verify it has:
   ```
   VITE_SUPABASE_URL="https://awmvzvilzybepijldrur.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
   ```
3. **Restart dev server** after changing `.env`

---

### Issue: "Sign in fails" or "Table doesn't exist"

**Fix**: 
- You probably didn't run migrations!
- Run Step 2 above: `npm run supabase:db:push`

---

### Issue: "npm command not found"

**Fix**:
- Make sure Node.js is installed
- Check: `node --version` (should show v18+)
- Check: `npm --version` (should show version number)
- If not installed: Download from https://nodejs.org/

---

### Issue: PowerShell script execution disabled

**Fix**:
```powershell
# Run this in PowerShell as Administrator
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Or use **Command Prompt (cmd)** instead of PowerShell.

---

## 📋 Complete Command Sequence

Copy/paste this entire sequence:

```powershell
# 1. Install dependencies
npm install

# 2. Login to Supabase (if not already logged in)
npm run supabase:login

# 3. Link to your project (if not already linked)
npm run supabase:link -- --project-ref awmvzvilzybepijldrur

# 4. Create database tables
npm run supabase:db:push

# 5. Deploy Edge Functions
npm run supabase:functions:deploy

# 6. Start dev server
npm run dev
```

Then open: **http://localhost:8080**

---

## 🎯 What Each Command Does

| Command | What It Does |
|---------|-------------|
| `npm install` | Downloads all required packages |
| `npm run supabase:login` | Connects your computer to Supabase |
| `npm run supabase:link` | Links project to your Supabase project |
| `npm run supabase:db:push` | Creates tables in your database |
| `npm run supabase:functions:deploy` | Uploads Edge Functions to Supabase |
| `npm run dev` | Starts the development server |

---

## 🛑 Stop the Server

When you're done testing:

1. Go back to PowerShell
2. Press **Ctrl + C**
3. Type `Y` and press Enter

---

## 📝 Next Steps After Running

1. **Test Sign Up**: Create a test account
2. **Test Sign In**: Login with your account
3. **Create a Capsule**: Test the main feature
4. **Check Database**: Go to Supabase dashboard → Table Editor → See your data!

---

## 🆘 Still Having Issues?

**Check these**:
1. ✅ Node.js installed? (`node --version`)
2. ✅ `.env` file exists with correct values?
3. ✅ Database migrations run? (`npm run supabase:db:push`)
4. ✅ Browser console errors? (Press F12 → Console tab)

**Share**:
- What error message you see
- Which step failed
- Browser console errors (if any)

---

## 🎉 Success!

If everything works, you should see:
- ✅ Homepage loads
- ✅ Can sign up
- ✅ Can sign in
- ✅ Can create capsules
- ✅ Data appears in Supabase dashboard

**You're all set!** 🚀
