-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reserved usernames list
CREATE TABLE public.reserved_usernames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE
);

-- Insert reserved usernames
INSERT INTO public.reserved_usernames (username) VALUES
  ('uno'),
  ('unogo'),
  ('orynuno'),
  ('oryn179'),
  ('admin'),
  ('administrator'),
  ('moderator'),
  ('system'),
  ('support');

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL CHECK (game_type IN ('ai', 'friends', 'worldwide')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_player_index INTEGER NOT NULL DEFAULT 0,
  direction INTEGER NOT NULL DEFAULT 1, -- 1 or -1
  current_color TEXT CHECK (current_color IN ('red', 'blue', 'green', 'yellow')),
  draw_pile JSONB NOT NULL DEFAULT '[]',
  discard_pile JSONB NOT NULL DEFAULT '[]',
  winner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Game players junction table
CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id),
  player_index INTEGER NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  ai_name TEXT,
  hand JSONB NOT NULL DEFAULT '[]',
  has_called_uno BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_index)
);

-- Friend invites for games
CREATE TABLE public.game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reserved usernames - readable by all
CREATE POLICY "Reserved usernames are viewable by everyone" ON public.reserved_usernames
  FOR SELECT USING (true);

-- Games policies
CREATE POLICY "Games are viewable by participants" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create games" ON public.games
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Game updates by participants" ON public.games
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.game_players gp
      JOIN public.profiles p ON gp.profile_id = p.id
      WHERE gp.game_id = games.id AND p.user_id = auth.uid()
    )
  );

-- Game players policies
CREATE POLICY "Game players viewable by all" ON public.game_players
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join games" ON public.game_players
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Players can update own hand" ON public.game_players
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR is_ai = true
  );

-- Game invites policies
CREATE POLICY "Users can view their invites" ON public.game_invites
  FOR SELECT USING (
    from_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR to_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send invites" ON public.game_invites
  FOR INSERT WITH CHECK (
    from_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can respond to invites" ON public.game_invites
  FOR UPDATE USING (
    to_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Enable realtime for games
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invites;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if username is available
CREATE OR REPLACE FUNCTION public.is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if username is reserved
  IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE LOWER(username) = LOWER(check_username)) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if username is taken
  IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(check_username)) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to generate username suggestions
CREATE OR REPLACE FUNCTION public.generate_username_suggestions(base_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
  suggestions TEXT[] := ARRAY[]::TEXT[];
  candidate TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    candidate := LOWER(base_name) || '_uno' || floor(random() * 999 + 1)::TEXT;
    IF public.is_username_available(candidate) THEN
      suggestions := array_append(suggestions, candidate);
    END IF;
  END LOOP;
  
  -- Add more variety
  FOR i IN 1..5 LOOP
    candidate := 'player' || floor(random() * 9999 + 1)::TEXT;
    IF public.is_username_available(candidate) AND array_length(suggestions, 1) < 5 THEN
      suggestions := array_append(suggestions, candidate);
    END IF;
  END LOOP;
  
  RETURN suggestions[1:5];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;