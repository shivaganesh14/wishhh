-- Run notification check every 1 minute so emails send at (or within 1 min of) the exact unlock time.
-- Re-scheduling with the same job name replaces the previous schedule.
SELECT cron.schedule(
  'send-capsule-notification',
  '* * * * *',
  $$SELECT public.invoke_capsule_notification();$$
);
