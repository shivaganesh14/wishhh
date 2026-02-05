-- Fix 1: Add RLS policy to deny anonymous SELECT access to capsules table
CREATE POLICY "Deny anonymous access to capsules"
ON public.capsules
FOR SELECT
TO anon
USING (false);

-- Fix 2: Add RLS policy to deny anonymous SELECT access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Fix 3: Secure the capsules_public view by enabling RLS on it
-- First, we need to drop and recreate the view with proper security
DROP VIEW IF EXISTS public.capsules_public;

-- Recreate the view with security_invoker to inherit RLS from the base table
CREATE VIEW public.capsules_public
WITH (security_invoker = on) AS
SELECT 
  id,
  title,
  content,
  media_url,
  media_type,
  unlock_at,
  is_unlocked,
  is_opened,
  has_password,
  open_once,
  created_at,
  share_token
FROM public.capsules;