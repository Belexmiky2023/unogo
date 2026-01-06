-- Drop the old constraint and add a new one with more task types
ALTER TABLE public.daily_tasks 
DROP CONSTRAINT IF EXISTS daily_tasks_task_type_check;

ALTER TABLE public.daily_tasks 
ADD CONSTRAINT daily_tasks_task_type_check 
CHECK (task_type = ANY (ARRAY['play_games'::text, 'win_games'::text, 'refer_friend'::text, 'login'::text, 'custom'::text, 'telegram'::text, 'twitter'::text, 'discord'::text, 'youtube'::text, 'external_link'::text]));

-- Create sample daily tasks for today with valid types
INSERT INTO public.daily_tasks (title, description, task_type, requirement_value, xp_reward, valid_date, is_active)
VALUES 
  ('First Win of the Day', 'Win your first game today to earn bonus XP!', 'win_games', 1, 50, CURRENT_DATE, true),
  ('Play 3 Games', 'Play 3 games in any mode', 'play_games', 3, 30, CURRENT_DATE, true),
  ('Daily Login', 'Login to claim your daily bonus', 'login', 1, 15, CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- Create sample weekly challenges
INSERT INTO public.challenges (title, description, challenge_type, requirement_type, requirement_value, xp_reward, is_active)
VALUES 
  ('Weekly Winner', 'Win 10 games this week', 'weekly', 'wins', 10, 200, true),
  ('Marathon Player', 'Play 30 games this week', 'weekly', 'games_played', 30, 150, true),
  ('UNO Master', 'Call UNO 20 times this week', 'weekly', 'uno_calls', 20, 100, true),
  ('Daily Streak', 'Win at least one game every day', 'daily', 'wins', 1, 75, true),
  ('Speed Runner', 'Win 3 games in a single day', 'daily', 'wins', 3, 100, true)
ON CONFLICT DO NOTHING;