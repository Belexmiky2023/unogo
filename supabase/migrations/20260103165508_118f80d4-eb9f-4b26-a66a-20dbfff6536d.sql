-- Create matchmaking queue for worldwide games
CREATE TABLE public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'waiting',
  UNIQUE(profile_id)
);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can join queue" ON public.matchmaking_queue
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view queue" ON public.matchmaking_queue
  FOR SELECT USING (true);

CREATE POLICY "Users can leave queue" ON public.matchmaking_queue
  FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can update queue" ON public.matchmaking_queue
  FOR UPDATE USING (true);

-- Create game messages for in-game chat
CREATE TABLE public.game_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game participants can send messages" ON public.game_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players gp 
      JOIN profiles p ON gp.profile_id = p.id
      WHERE gp.game_id = game_messages.game_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Game participants can view messages" ON public.game_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_players gp 
      JOIN profiles p ON gp.profile_id = p.id
      WHERE gp.game_id = game_messages.game_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create ranks table
CREATE TABLE public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  badge_color TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Insert default ranks
INSERT INTO public.ranks (name, min_xp, badge_color, icon) VALUES
  ('Beginner', 0, 'gray', '🃏'),
  ('Amateur', 500, 'green', '🌱'),
  ('Intermediate', 1500, 'blue', '⭐'),
  ('Advanced', 3500, 'purple', '💫'),
  ('Expert', 7000, 'orange', '🔥'),
  ('Master', 15000, 'red', '👑'),
  ('Grandmaster', 30000, 'yellow', '🏆'),
  ('Legend', 50000, 'rainbow', '💎');

ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ranks are viewable by all" ON public.ranks
  FOR SELECT USING (true);

-- Create card themes table
CREATE TABLE public.card_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  required_xp INTEGER NOT NULL DEFAULT 0,
  theme_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO public.card_themes (name, required_xp, theme_data, is_default) VALUES
  ('Classic', 0, '{"style": "classic", "effects": []}', true),
  ('Neon', 1000, '{"style": "neon", "effects": ["glow"]}', false),
  ('Gold', 3000, '{"style": "gold", "effects": ["shimmer"]}', false),
  ('Galaxy', 6000, '{"style": "galaxy", "effects": ["stars", "glow"]}', false),
  ('Fire', 10000, '{"style": "fire", "effects": ["flames", "glow"]}', false),
  ('Ice', 15000, '{"style": "ice", "effects": ["frost", "shimmer"]}', false),
  ('Rainbow', 25000, '{"style": "rainbow", "effects": ["rainbow", "glow"]}', false),
  ('Diamond', 40000, '{"style": "diamond", "effects": ["sparkle", "shimmer", "glow"]}', false);

ALTER TABLE public.card_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Themes are viewable by all" ON public.card_themes
  FOR SELECT USING (true);

-- Add selected_theme to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_theme UUID REFERENCES public.card_themes(id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_messages;