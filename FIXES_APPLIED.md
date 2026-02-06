# Fixes Applied - Date Storage & Open Once

## ✅ Issue 1: Dates Saved Incorrectly (Forwarded)

**Problem:** When selecting a date like "Jan 6, 2026", it was being stored as "Feb 6, 2026" in the database (one month ahead).

**Fix Applied:**
- Updated `CreateCapsule.tsx` to extract date parts directly from the calendar Date object using local timezone methods (`getFullYear()`, `getMonth()`, `getDate()`)
- Ensures the exact date/time the user picks is stored without timezone conversion shifts
- The date is built as `new Date(year, month, day, hours, minutes, 0, 0)` in local time, then converted to UTC via `toISOString()` for storage

**Files Changed:**
- `src/pages/CreateCapsule.tsx` (line ~121-127)

**To Apply:**
1. Redeploy your app to Vercel (push changes or trigger redeploy)
2. **New capsules** will store dates correctly
3. For **existing capsules** with wrong dates, run this SQL in Supabase → SQL Editor:

```sql
-- Fix existing capsules: subtract one month from unlock_at for Feb 2026 entries
UPDATE public.capsules
SET unlock_at = unlock_at - interval '1 month'
WHERE unlock_at >= '2026-02-01'::timestamptz
  AND unlock_at < '2026-03-01'::timestamptz;
```

---

## ✅ Issue 2: Open Once Not Working

**Problem:** Capsules with "Open Once" enabled could be viewed multiple times.

**Fix Applied:**
- Added check in `ViewCapsule.tsx` that prevents viewing if `open_once = true` AND `is_opened = true`
- Shows "Already Opened" message when someone tries to view a capsule that was already opened
- Added safeguard in `revealCapsule()` function to prevent revealing if already opened
- Updates local state after marking as opened so the check works immediately

**Files Changed:**
- `src/pages/ViewCapsule.tsx` (lines ~83-87, ~156-175, ~237-260)

**To Apply:**
- Redeploy your app to Vercel
- Works immediately for all capsules with `open_once = true`

---

## 🚀 Next Steps

1. **Commit and push** these changes to your repo
2. **Vercel will auto-deploy** (or trigger manual deploy)
3. **Test:**
   - Create a new capsule with a future date → verify it stores correctly in DB
   - Create a capsule with "Open Once" → open it once → try to open again → should show "Already Opened"
4. **Fix existing wrong dates** using the SQL above if needed

---

## 📝 Notes

- The date fix ensures `unlock_at` matches exactly what you pick in the calendar
- `created_at` is set by the database (`DEFAULT now()`) so it's always the exact server time
- Open Once now properly blocks access after the first view
