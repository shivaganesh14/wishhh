-- Make the capsule-media storage bucket private
UPDATE storage.buckets SET public = false WHERE id = 'capsule-media';

-- Create a secure RPC function to generate signed URLs for capsule media
-- This ensures media is only accessible through proper authorization
CREATE OR REPLACE FUNCTION public.get_signed_media_url(p_share_token uuid, p_media_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_capsule_id uuid;
  v_unlock_at timestamp with time zone;
  v_is_unlocked boolean;
BEGIN
  -- Verify the capsule exists and get its details
  SELECT id, unlock_at, is_unlocked INTO v_capsule_id, v_unlock_at, v_is_unlocked
  FROM public.capsules
  WHERE share_token = p_share_token;
  
  IF v_capsule_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if capsule is unlocked (time has passed)
  IF now() < v_unlock_at THEN
    RETURN NULL;
  END IF;
  
  -- Return the path - actual signed URL generation happens in edge function
  -- This function just validates access
  RETURN p_media_path;
END;
$$;