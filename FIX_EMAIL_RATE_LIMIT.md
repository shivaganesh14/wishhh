# 🔧 Fix: Email Rate Limited Error

## Problem
Supabase is rate-limiting email sends. This happens when:
- Too many signup attempts
- Email confirmation is enabled
- Free tier has strict email limits

---

## ✅ Solution: Disable Email Confirmation (For Development)

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/awmvzvilzybepijldrur
2. Click **Authentication** in the left sidebar
3. Click **Settings** (or go to Authentication → Settings)

### Step 2: Disable Email Confirmation

1. Scroll down to **Email Auth** section
2. Find **"Enable email confirmations"**
3. **Turn it OFF** (toggle switch)
4. Click **Save** at the bottom

### Step 3: Update Site URL (Important!)

While you're in Settings:

1. Find **Site URL** field
2. Set it to: `http://localhost:8080`
3. Find **Redirect URLs** section
4. Add: `http://localhost:8080/**`
5. Click **Save**

---

## ✅ Alternative: Wait for Rate Limit to Reset

If you want to keep email confirmation enabled:

1. **Wait 1 hour** - Rate limits usually reset hourly
2. **Use a different email** - Try signing up with a new email address
3. **Check Supabase Dashboard** → **Logs** → **Auth Logs** to see rate limit status

---

## 🧪 Test After Fixing

1. **Clear browser data** (optional):
   - Press F12 → Application tab → Clear Local Storage
   - Or use incognito/private window

2. **Try signing up again**:
   - Go to http://localhost:8080/auth
   - Click "Sign Up"
   - Enter email and password
   - Should work immediately (no email needed)

3. **Try signing in**:
   - Use the same credentials
   - Should work immediately

---

## 📋 Supabase Email Rate Limits (Free Tier)

- **Email sends per hour**: ~3-4 emails
- **Email sends per day**: ~100 emails
- **After limit**: Rate limited error

**For development**: Disable email confirmation to avoid this.

**For production**: You'll need to:
- Use SendGrid (already set up ✅)
- Or upgrade Supabase plan
- Or implement your own email service

---

## 🔍 Verify Settings

After disabling email confirmation, verify:

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. **"Enable email confirmations"** = **OFF** ✅
3. **Site URL** = `http://localhost:8080` ✅
4. **Redirect URLs** includes `http://localhost:8080/**` ✅

---

## ✅ Quick Fix Summary

**Fastest solution**:
1. Supabase Dashboard → Authentication → Settings
2. Turn OFF "Enable email confirmations"
3. Save
4. Try signing up again

**This allows immediate signup/login without email verification!**

---

## 🆘 Still Having Issues?

If you still see rate limit errors:

1. **Wait 1 hour** - Rate limits reset
2. **Check Supabase Dashboard** → **Logs** → **Auth Logs**
3. **Try different email** - Use a completely new email address
4. **Clear browser cache** - Press Ctrl+Shift+Delete → Clear cache

---

## 💡 For Production (Later)

When you deploy to production:

1. **Keep email confirmation OFF** if using SendGrid for all emails
2. **OR enable email confirmation** and use Supabase's email service
3. **OR upgrade Supabase plan** for higher email limits
4. **Use SendGrid** for capsule notifications (already configured ✅)

---

## ✅ After Fixing

You should be able to:
- ✅ Sign up immediately (no email needed)
- ✅ Sign in immediately
- ✅ Create capsules
- ✅ Use all features

**No more rate limit errors!** 🎉
