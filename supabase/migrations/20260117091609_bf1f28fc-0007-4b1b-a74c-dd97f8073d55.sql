-- Drop and recreate the function with updated return type (no password_hash)
DROP FUNCTION IF EXISTS public.get_capsule_by_share_token(uuid);

-- Create a secure function that never returns password_hash
CREATE FUNCTION public.get_capsule_by_share_token(p_share_token uuid)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  media_url text,
  media_type text,
  unlock_at timestamp with time zone,
  is_unlocked boolean,
  is_opened boolean,
  has_password boolean,
  open_once boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.content,
    c.media_url,
    c.media_type,
    c.unlock_at,
    c.is_unlocked,
    c.is_opened,
    c.has_password,
    c.open_once,
    c.created_at
  FROM public.capsules c
  WHERE c.share_token = p_share_token;
END;
$$;

-- Create a secure password verification function that never exposes the hash
CREATE OR REPLACE FUNCTION public.verify_capsule_password(p_share_token uuid, p_password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT c.password_hash INTO stored_hash
  FROM public.capsules c
  WHERE c.share_token = p_share_token;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = p_password_hash;
END;
$$;

-- Update mark_capsule_opened to prevent re-opening of open_once capsules
CREATE OR REPLACE FUNCTION public.mark_capsule_opened(p_share_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  capsule_open_once boolean;
  capsule_is_opened boolean;
BEGIN
  SELECT c.open_once, c.is_opened INTO capsule_open_once, capsule_is_opened
  FROM public.capsules c
  WHERE c.share_token = p_share_token;
  
  IF capsule_open_once AND capsule_is_opened THEN
    RETURN false;
  END IF;
  
  UPDATE public.capsules
  SET is_opened = true, is_unlocked = true
  WHERE share_token = p_share_token;
  
  RETURN FOUND;
END;
$$;