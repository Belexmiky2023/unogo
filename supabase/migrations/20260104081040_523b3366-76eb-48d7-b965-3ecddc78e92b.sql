
-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(md5(NEW.id::text || now()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic referral code generation
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.profiles;
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = UPPER(SUBSTRING(md5(id::text || created_at::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Referrals table to track referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_rewarded INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals" ON public.referrals
FOR SELECT USING (
  referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  referred_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "System can insert referrals" ON public.referrals
FOR INSERT WITH CHECK (
  referred_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Challenges table for daily/weekly challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('wins', 'games_played', 'cards_played', 'uno_calls', 'custom')),
  requirement_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by all" ON public.challenges
FOR SELECT USING (true);

CREATE POLICY "Admins can manage challenges" ON public.challenges
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User challenge progress
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their challenge progress" ON public.user_challenges
FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their challenge progress" ON public.user_challenges
FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Seasonal events table
CREATE TABLE IF NOT EXISTS public.seasonal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#FFD700',
  banner_image TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by all" ON public.seasonal_events
FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON public.seasonal_events
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Event rewards (special themes, badges for events)
CREATE TABLE IF NOT EXISTS public.event_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.seasonal_events(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('theme', 'badge', 'xp_boost')),
  reward_data JSONB NOT NULL DEFAULT '{}',
  xp_required INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event rewards viewable by all" ON public.event_rewards
FOR SELECT USING (true);

CREATE POLICY "Admins can manage event rewards" ON public.event_rewards
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User event progress
CREATE TABLE IF NOT EXISTS public.user_event_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.seasonal_events(id) ON DELETE CASCADE,
  event_xp INTEGER NOT NULL DEFAULT 0,
  rewards_claimed JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, event_id)
);

ALTER TABLE public.user_event_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their event progress" ON public.user_event_progress
FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their event progress" ON public.user_event_progress
FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admin posts table
CREATE TABLE IF NOT EXISTS public.admin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by all" ON public.admin_posts
FOR SELECT USING (true);

CREATE POLICY "Admins can manage posts" ON public.admin_posts
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Daily tasks (admin created tasks for users to complete)
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('play_games', 'win_games', 'refer_friend', 'login', 'custom')),
  requirement_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by all" ON public.daily_tasks
FOR SELECT USING (true);

CREATE POLICY "Admins can manage tasks" ON public.daily_tasks
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User daily task completions
CREATE TABLE IF NOT EXISTS public.user_daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  xp_claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, task_id)
);

ALTER TABLE public.user_daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their task progress" ON public.user_daily_tasks
FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their task progress" ON public.user_daily_tasks
FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create storage bucket for admin post images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admin-images', 'admin-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for admin images
CREATE POLICY "Admin images publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-images');

CREATE POLICY "Admins can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'admin-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'admin-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'admin-images' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seasonal_events;
