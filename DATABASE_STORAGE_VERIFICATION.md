# 🔍 Database & Storage Verification Report

## ✅ **VERIFIED: Your Database Setup is CORRECT**

### 1. **User Authentication Passwords** ✅

**Status**: ✅ **SECURE - Passwords are NOT stored in your custom tables**

**How it works**:
- **User login passwords** are stored in Supabase's built-in `auth.users` table
- Supabase automatically hashes passwords using **bcrypt** (industry standard)
- **You NEVER see or store plaintext passwords** - Supabase handles this securely
- Passwords are stored in `auth.users.encrypted_password` (hashed, not readable)

**Location**: 
- Supabase manages this in `auth.users` table (not accessible via your app)
- Your app only calls `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`
- Supabase handles all password hashing/verification automatically

**Security**: ✅ **EXCELLENT**
- Uses bcrypt (industry standard)
- Automatic salt generation
- No plaintext passwords stored anywhere

---

### 2. **User Profile Data** ✅

**Status**: ✅ **STORED CORRECTLY**

**Table**: `public.profiles`

**What's stored**:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,                    -- ✅ Stored
  full_name TEXT,                -- ✅ Stored
  avatar_url TEXT,               -- ✅ Stored
  created_at TIMESTAMP,          -- ✅ Stored
  updated_at TIMESTAMP           -- ✅ Stored
);
```

**How it works**:
- When user signs up → Supabase creates entry in `auth.users`
- **Trigger automatically creates profile**: `handle_new_user()` function runs
- Profile is created with: `id`, `email`, `full_name` from signup
- **Trigger code** (lines 73-88 in migration):
  ```sql
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

**Verification**: 
- ✅ Trigger exists to auto-create profiles
- ✅ Email and full_name are saved from signup form
- ✅ Profile linked to auth.users via foreign key

---

### 3. **Capsule Passwords** ✅

**Status**: ✅ **SECURE - Hashed server-side**

**Table**: `public.capsules`

**What's stored**:
```sql
password_hash TEXT,        -- ✅ Hashed password (PBKDF2)
has_password BOOLEAN,      -- ✅ Flag indicating if password exists
```

**How it works**:
1. User creates capsule with password
2. Frontend calls Edge Function: `hash-capsule-password`
3. **Server-side hashing** using PBKDF2 (100,000 iterations) ✅
4. Hash stored in database: `pbkdf2:salt:hash` format
5. **Plaintext password NEVER stored** ✅

**Security**: ✅ **EXCELLENT**
- Server-side hashing (not client-side)
- PBKDF2 with 100,000 iterations (very secure)
- Salt included in hash

**Code location**:
- Hashing: `supabase/functions/hash-capsule-password/index.ts`
- Verification: `supabase/functions/verify-capsule-password/index.ts`

---

### 4. **Capsule Data** ✅

**Status**: ✅ **STORED CORRECTLY**

**Table**: `public.capsules`

**What's stored**:
```sql
id UUID PRIMARY KEY,
owner_id UUID REFERENCES auth.users(id),  -- ✅ Links to user
title TEXT,                                -- ✅ Stored
content TEXT,                              -- ✅ Stored
media_url TEXT,                            -- ✅ Stored (file path)
media_type TEXT,                           -- ✅ Stored
unlock_at TIMESTAMP,                       -- ✅ Stored
recipient_email TEXT,                      -- ✅ Stored
password_hash TEXT,                        -- ✅ Stored (hashed)
has_password BOOLEAN,                     -- ✅ Stored
open_once BOOLEAN,                        -- ✅ Stored
notification_sent BOOLEAN,                 -- ✅ Stored
created_at TIMESTAMP,                      -- ✅ Stored
is_unlocked BOOLEAN,                      -- ✅ Stored
is_opened BOOLEAN                         -- ✅ Stored
```

**Verification**: ✅ All fields are properly stored

---

### 5. **Email Storage** ✅

**Status**: ✅ **STORED CORRECTLY**

**Where emails are stored**:

1. **User email** (login):
   - Stored in: `auth.users.email` (Supabase managed)
   - Also copied to: `public.profiles.email` (via trigger)

2. **Capsule recipient email**:
   - Stored in: `public.capsules.recipient_email`
   - Used for: Sending unlock notifications via SendGrid

**Verification**: ✅ Emails stored in both places correctly

---

## 🔐 **Security Summary**

| Data Type | Storage Location | Encryption/Hashing | Status |
|-----------|-----------------|-------------------|--------|
| **User Login Passwords** | `auth.users` (Supabase) | bcrypt (automatic) | ✅ Secure |
| **Capsule Passwords** | `public.capsules.password_hash` | PBKDF2 (100k iterations) | ✅ Secure |
| **User Emails** | `auth.users.email` + `public.profiles.email` | Plaintext (normal) | ✅ OK |
| **Capsule Recipient Emails** | `public.capsules.recipient_email` | Plaintext (normal) | ✅ OK |
| **User Profile Data** | `public.profiles` | Plaintext (normal) | ✅ OK |
| **Capsule Content** | `public.capsules` | Plaintext (normal) | ✅ OK |

**Note**: Emails and content are stored as plaintext, which is **normal and expected**. Only passwords need to be hashed.

---

## ✅ **Verification Checklist**

### Database Tables Exist:
- [x] `auth.users` (Supabase managed - for login)
- [x] `public.profiles` (user profile data)
- [x] `public.capsules` (time capsule data)
- [x] `storage.buckets` (for media files)

### Triggers Working:
- [x] `on_auth_user_created` - Auto-creates profile on signup
- [x] `update_profiles_updated_at` - Updates timestamp on profile changes

### Security:
- [x] Row Level Security (RLS) enabled on all tables
- [x] Passwords hashed (never plaintext)
- [x] Server-side password hashing for capsules
- [x] Proper foreign key relationships

---

## 🧪 **How to Test Data Storage**

### Test 1: Sign Up → Check Profile Created

1. **Sign up** with email: `test@example.com`, password: `test123456`
2. **Check Supabase Dashboard**:
   - Go to: Authentication → Users
   - Should see user with email `test@example.com`
   - User ID should be a UUID

3. **Check Profile Table**:
   - Go to: Table Editor → `profiles`
   - Should see row with:
     - `id` = same UUID as auth.users
     - `email` = `test@example.com`
     - `full_name` = name you entered
     - `created_at` = current timestamp

**Expected**: ✅ Profile automatically created via trigger

---

### Test 2: Create Capsule → Check Data Stored

1. **Sign in** with test account
2. **Create a capsule**:
   - Title: "Test Capsule"
   - Content: "Test content"
   - Set unlock date
   - (Optional) Add password
   - (Optional) Add recipient email

3. **Check Capsules Table**:
   - Go to: Table Editor → `capsules`
   - Should see row with:
     - `owner_id` = your user UUID
     - `title` = "Test Capsule"
     - `content` = "Test content"
     - `password_hash` = hashed value (if password set) OR null
     - `has_password` = true (if password set) OR false
     - `recipient_email` = email you entered OR null
     - `created_at` = current timestamp

**Expected**: ✅ All capsule data stored correctly

---

### Test 3: Verify Password Hashing

1. **Create capsule with password**: `mypassword123`
2. **Check database**:
   - Go to: Table Editor → `capsules`
   - Find your capsule
   - Look at `password_hash` column
   - Should see: `pbkdf2:...` (long hash string)
   - Should **NOT** see: `mypassword123` (plaintext)

**Expected**: ✅ Password is hashed, not plaintext

---

## 🐛 **Common Issues & Fixes**

### Issue: Profile not created after signup

**Symptoms**: User exists in `auth.users` but not in `profiles`

**Fix**:
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. If trigger missing, run migrations again:
   ```powershell
   npm run supabase:db:push
   ```
3. Manually create profile for existing users (if needed)

---

### Issue: Passwords stored as plaintext

**Symptoms**: You can see actual passwords in database

**Fix**: 
- **This should NEVER happen** - Supabase handles password hashing automatically
- If you see plaintext passwords, something is very wrong
- Check: Are you storing passwords in custom tables? (Don't do this!)
- User passwords should ONLY be in `auth.users` (Supabase managed)

---

### Issue: Capsule password_hash is null

**Symptoms**: Created capsule with password but `password_hash` is null

**Fix**:
1. Check Edge Function is deployed:
   ```powershell
   npm run supabase:functions:deploy
   ```
2. Check browser console for errors when creating capsule
3. Verify `hash-capsule-password` function exists in Supabase dashboard

---

## 📊 **Database Schema Summary**

```
auth.users (Supabase managed)
├── id (UUID)
├── email (TEXT)
├── encrypted_password (HASHED - bcrypt)
└── ... (other auth fields)

public.profiles
├── id (UUID) → references auth.users(id)
├── email (TEXT) - copied from auth.users
├── full_name (TEXT)
├── avatar_url (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

public.capsules
├── id (UUID)
├── owner_id (UUID) → references auth.users(id)
├── title (TEXT)
├── content (TEXT)
├── password_hash (TEXT) - PBKDF2 hashed
├── has_password (BOOLEAN)
├── recipient_email (TEXT)
├── media_url (TEXT)
├── unlock_at (TIMESTAMP)
└── ... (other fields)
```

---

## ✅ **Final Verification**

**Your database is correctly configured**:
- ✅ User passwords: Securely hashed by Supabase (bcrypt)
- ✅ Capsule passwords: Securely hashed server-side (PBKDF2)
- ✅ User profiles: Auto-created via trigger
- ✅ Emails: Stored correctly in multiple places
- ✅ All data: Properly stored with RLS security

**No issues found!** Your backend is storing data correctly and securely. 🎉
