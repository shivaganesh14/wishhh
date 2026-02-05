-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create capsules table
CREATE TABLE public.capsules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  unlock_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  is_opened BOOLEAN NOT NULL DEFAULT false,
  recipient_email TEXT,
  password_hash TEXT,
  has_password BOOLEAN NOT NULL DEFAULT false,
  open_once BOOLEAN NOT NULL DEFAULT false,
  auto_expire_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on capsules
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

-- Capsule policies - owners can manage their capsules
CREATE POLICY "Users can view their own capsules" 
ON public.capsules FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create capsules" 
ON public.capsules FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own capsules" 
ON public.capsules FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own capsules" 
ON public.capsules FOR DELETE 
USING (auth.uid() = owner_id);

-- Public access policy for viewing unlocked capsules via public link
CREATE POLICY "Anyone can view capsules by id for public access" 
ON public.capsules FOR SELECT 
USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for capsule media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('capsule-media', 'capsule-media', true);

-- Storage policies
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view capsule media"
ON storage.objects FOR SELECT
USING (bucket_id = 'capsule-media');

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (bucket_id = 'capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]);