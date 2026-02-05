# 🔐 Authentication Troubleshooting Guide

## Sign-In Failing? Follow These Steps

### Step 1: Check Browser Console (Most Important!)

1. Open your browser (Chrome/Edge/Firefox)
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Try to sign in again
5. Look for **red error messages**

**Common errors you might see:**

#### Error: "Invalid login credentials"
- **Cause**: Wrong email/password OR user doesn't exist
- **Fix**: 
  - Double-check email/password spelling
  - Try signing up first (create account)
  - Check Supabase dashboard → Authentication → Users (see if user exists)

#### Error: "Email not confirmed"
- **Cause**: Supabase requires email confirmation but you haven't verified
- **Fix**: 
  - Check your email inbox (and spam folder)
  - Click the confirmation link in the email
  - OR disable email confirmation in Supabase dashboard (see Step 3)

#### Error: "Missing Supabase environment variables"
- **Cause**: `.env` file not loaded or wrong values
- **Fix**: 
  - Check `.env` file exists in project root
  - Verify values:
    ```
    VITE_SUPABASE_URL="https://awmvzvilzybepijldrur.supabase.co"
    VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
    ```
  - Restart dev server: Stop (`Ctrl+C`) and run `npm run dev` again

#### Error: Network/CORS error
- **Cause**: Supabase URL incorrect or network issue
- **Fix**: 
  - Verify `VITE_SUPABASE_URL` matches your Supabase project URL
  - Check internet connection
  - Try opening Supabase dashboard in browser (if that works, network is fine)

---

### Step 2: Verify Database Migrations Were Run

**If you haven't run migrations yet, auth won't work!**

Check if migrations were applied:

```powershell
npm run supabase:db:push
```

**Expected output**: Should show "Applied migration..." messages.

**If you see errors**:
- Make sure you're logged in: `npm run supabase:login`
- Make sure project is linked: `npm run supabase:link -- --project-ref awmvzvilzybepijldrur`

**Verify in Supabase Dashboard**:
1. Go to https://supabase.com/dashboard/project/awmvzvilzybepijldrur
2. Click **Table Editor** in left sidebar
3. You should see tables: `profiles`, `capsules`, etc.
4. Click **Authentication** → **Users** - you should see the users table

---

### Step 3: Check Supabase Auth Settings

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **Email Auth** section

**Important settings:**

#### Email Confirmation (Disable for Testing)
- **Option A**: Disable email confirmation (easier for testing)
  - Find **"Enable email confirmations"**
  - Turn it **OFF**
  - Click **Save**
  - Now you can sign in immediately after signup

- **Option B**: Keep email confirmation enabled
  - After signup, check your email
  - Click the confirmation link
  - Then try signing in

#### Site URL
- Make sure **Site URL** includes `http://localhost:8080`
- Add to **Redirect URLs**: `http://localhost:8080/**`

---

### Step 4: Test with a Fresh Account

1. **Sign Up** with a new email:
   - Email: `test@example.com` (use a real email you can access)
   - Password: `test123456` (at least 6 characters)
   - Full Name: `Test User`

2. **Check what happens**:
   - If email confirmation is OFF → You should be signed in immediately
   - If email confirmation is ON → Check your email for confirmation link

3. **Then try Sign In** with the same credentials

---

### Step 5: Check Supabase Dashboard → Logs

1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Try signing in again
3. Check the logs for errors

**Common log errors:**
- "User not found" → User doesn't exist (sign up first)
- "Invalid password" → Wrong password
- "Email not confirmed" → Need to verify email

---

### Step 6: Verify Environment Variables

**Check `.env` file** (in project root):

```env
VITE_SUPABASE_PROJECT_ID="awmvzvilzybepijldrur"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://awmvzvilzybepijldrur.supabase.co"
```

**Important**: 
- No quotes needed around values (but quotes are OK)
- No spaces around `=`
- Restart dev server after changing `.env`

**Test if env vars are loaded**:
- Open browser console (F12)
- Type: `import.meta.env.VITE_SUPABASE_URL`
- Should show: `"https://awmvzvilzybepijldrur.supabase.co"`

---

### Step 7: Clear Browser Data (Last Resort)

Sometimes cached data causes issues:

1. **Clear localStorage**:
   - Open browser console (F12)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Find **Local Storage** → `http://localhost:8080`
   - Right-click → **Clear**

2. **Or use incognito/private window**:
   - Open new incognito window
   - Go to `http://localhost:8080`
   - Try signing in

---

## 🐛 Quick Diagnostic Commands

Run these in PowerShell to check your setup:

```powershell
# 1. Check if Supabase CLI is linked
npx supabase status

# 2. Check if migrations are applied
npx supabase db diff

# 3. Check Supabase connection
# (Open browser console and check for errors)
```

---

## ✅ Success Checklist

Your sign-in should work if:

- [ ] `.env` file exists with correct values
- [ ] Dev server restarted after changing `.env`
- [ ] Database migrations applied (`npm run supabase:db:push`)
- [ ] Supabase project exists and is accessible
- [ ] Email confirmation disabled OR email verified
- [ ] Browser console shows no errors
- [ ] User exists in Supabase dashboard → Authentication → Users

---

## 🆘 Still Not Working?

**Share these details:**

1. **Browser console errors** (copy/paste the red error messages)
2. **What happens when you click "Sign In"**:
   - Does it show "Signing in..." forever?
   - Does it show an error toast?
   - Does it redirect but then fail?
3. **Did you run database migrations?** (`npm run supabase:db:push`)
4. **Can you see users in Supabase dashboard?** (Authentication → Users)

---

## 💡 Common Fixes Summary

| Problem | Quick Fix |
|---------|-----------|
| "Invalid credentials" | Sign up first, then sign in |
| "Email not confirmed" | Disable email confirmation in Supabase settings |
| "Missing env vars" | Check `.env` file, restart dev server |
| "Table doesn't exist" | Run `npm run supabase:db:push` |
| Nothing happens | Check browser console (F12) for errors |
