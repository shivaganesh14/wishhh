-- =============================================
-- SECURITY FIX: Remove dangerous public access policy
-- and implement secure share token mechanism
-- =============================================

-- Step 1: Add secure share_token column for public sharing
ALTER TABLE public.capsules 
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Step 2: DROP the dangerous public SELECT policy that exposes all data
DROP POLICY IF EXISTS "Anyone can view capsules by id for public access" ON public.capsules;

-- Step 3: Create a secure public view that EXCLUDES sensitive fields
-- This view hides password_hash and other sensitive data
CREATE OR REPLACE VIEW public.capsules_public
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

-- Step 4: Create a security definer function to get capsule by share token
-- This allows public access ONLY via valid share token, not by ID alone
CREATE OR REPLACE FUNCTION public.get_capsule_by_share_token(p_share_token UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  unlock_at TIMESTAMPTZ,
  is_unlocked BOOLEAN,
  is_opened BOOLEAN,
  has_password BOOLEAN,
  password_hash TEXT,
  open_once BOOLEAN,
  created_at TIMESTAMPTZ
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
    c.password_hash,
    c.open_once,
    c.created_at
  FROM public.capsules c
  WHERE c.share_token = p_share_token;
END;
$$;

-- Step 5: Create function to mark capsule as opened (for share token access)
CREATE OR REPLACE FUNCTION public.mark_capsule_opened(p_share_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.capsules
  SET is_opened = true, is_unlocked = true
  WHERE share_token = p_share_token;
  
  RETURN FOUND;
END;
$$;

-- Step 6: Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION public.get_capsule_by_share_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_capsule_by_share_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_capsule_opened(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_capsule_opened(UUID) TO authenticated;