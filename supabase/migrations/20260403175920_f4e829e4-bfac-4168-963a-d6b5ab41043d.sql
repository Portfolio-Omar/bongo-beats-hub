
-- Badge definitions table
CREATE TABLE public.badge_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏅',
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read badges" ON public.badge_definitions FOR SELECT USING (true);
CREATE POLICY "Admin manage badges" ON public.badge_definitions FOR ALL USING (true) WITH CHECK (true);

-- User badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System insert badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- User gamification (points, level, xp)
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Beginner',
  xp integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read gamification" ON public.user_gamification FOR SELECT USING (true);
CREATE POLICY "Users insert own gamification" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own gamification" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);

-- Private messages table
CREATE TABLE public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text,
  song_id uuid REFERENCES public.songs(id),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages" ON public.private_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON public.private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update own received messages" ON public.private_messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Admin read all messages" ON public.private_messages FOR SELECT USING (true);

-- Insert default badge definitions
INSERT INTO public.badge_definitions (name, description, icon, category, requirement_type, requirement_value) VALUES
('Top Listener', 'Listen to 100 songs', '🎧', 'listening', 'songs_listened', 100),
('Super Fan', 'Listen to 500 songs', '⭐', 'listening', 'songs_listened', 500),
('Music Legend', 'Listen to 1000 songs', '👑', 'listening', 'songs_listened', 1000),
('Social Butterfly', 'Send 50 messages', '🦋', 'social', 'messages_sent', 50),
('Throwback King', 'Listen to 50 different artists', '🤴', 'listening', 'unique_artists', 50),
('First Steps', 'Listen to your first song', '👶', 'listening', 'songs_listened', 1),
('Commentator', 'Leave 20 comments', '💬', 'social', 'comments_made', 20),
('Share Master', 'Share 10 songs', '📤', 'social', 'songs_shared', 10),
('Streak Keeper', 'Maintain a 7-day streak', '🔥', 'engagement', 'streak_days', 7),
('Early Bird', 'Be among the first 100 users', '🐦', 'special', 'early_user', 1);

-- Function to award points
CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_xp integer;
  _new_level text;
  _level_up boolean := false;
BEGIN
  INSERT INTO user_gamification (user_id, points, xp, last_activity_date)
  VALUES (_user_id, _points, _points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    points = user_gamification.points + _points,
    xp = user_gamification.xp + _points,
    streak_days = CASE
      WHEN user_gamification.last_activity_date = CURRENT_DATE - 1 THEN user_gamification.streak_days + 1
      WHEN user_gamification.last_activity_date = CURRENT_DATE THEN user_gamification.streak_days
      ELSE 1
    END,
    last_activity_date = CURRENT_DATE,
    updated_at = now();

  SELECT xp INTO _current_xp FROM user_gamification WHERE user_id = _user_id;

  _new_level := CASE
    WHEN _current_xp >= 5000 THEN 'Legend'
    WHEN _current_xp >= 2000 THEN 'Super Fan'
    WHEN _current_xp >= 1000 THEN 'Pro'
    WHEN _current_xp >= 500 THEN 'Rising Star'
    WHEN _current_xp >= 100 THEN 'Explorer'
    ELSE 'Beginner'
  END;

  UPDATE user_gamification SET level = _new_level WHERE user_id = _user_id AND level != _new_level
  RETURNING true INTO _level_up;

  RETURN jsonb_build_object('points', _points, 'total_xp', _current_xp, 'level', _new_level, 'level_up', COALESCE(_level_up, false));
END;
$$;
