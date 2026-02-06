-- One-time fix: subtract one month from unlock_at for capsules saved with the
-- wrong month (e.g. Jan 6 00:00 IST intended but stored as Feb 5 18:30 UTC).
-- Run in Supabase SQL Editor. Check row count first with the SELECT below.

-- Preview: see which rows will be updated
-- SELECT id, unlock_at AS before_unlock, unlock_at - interval '1 month' AS after_unlock
-- FROM public.capsules
-- WHERE unlock_at >= '2026-02-01'::timestamptz AND unlock_at < '2026-03-01'::timestamptz;

UPDATE public.capsules
SET unlock_at = unlock_at - interval '1 month'
WHERE unlock_at >= '2026-02-01'::timestamptz
  AND unlock_at < '2026-03-01'::timestamptz;
