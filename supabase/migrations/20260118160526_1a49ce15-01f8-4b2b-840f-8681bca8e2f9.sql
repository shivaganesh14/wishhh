-- Drop the capsules_public view entirely
-- Public access should only go through the secure RPC functions:
-- get_capsule_by_share_token, verify_capsule_password, mark_capsule_opened
DROP VIEW IF EXISTS public.capsules_public;