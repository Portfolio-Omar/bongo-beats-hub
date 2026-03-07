
-- Listening history table
CREATE TABLE public.listening_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  play_duration_seconds numeric NOT NULL DEFAULT 0,
  song_duration_seconds numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  reward_given boolean NOT NULL DEFAULT false,
  reward_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own history" ON public.listening_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.listening_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own history" ON public.listening_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin read all history" ON public.listening_history FOR SELECT USING (true);

-- User earnings balance table
CREATE TABLE public.user_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  songs_listened_today integer NOT NULL DEFAULT 0,
  last_listen_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own earnings" ON public.user_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own earnings" ON public.user_earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own earnings" ON public.user_earnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin read all earnings" ON public.user_earnings FOR SELECT USING (true);

-- Shares boost table
CREATE TABLE public.share_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_date date NOT NULL DEFAULT CURRENT_DATE,
  boost_expiry timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, share_date)
);

ALTER TABLE public.share_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own boosts" ON public.share_boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own boosts" ON public.share_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin read all boosts" ON public.share_boosts FOR SELECT USING (true);

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_details text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin read all withdrawals" ON public.withdrawals FOR SELECT USING (true);
CREATE POLICY "Admin update withdrawals" ON public.withdrawals FOR UPDATE USING (true);

-- Function to process a song listen reward
CREATE OR REPLACE FUNCTION public.process_listen_reward(
  _user_id uuid,
  _song_id uuid,
  _play_duration numeric,
  _song_duration numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _completed boolean;
  _reward numeric;
  _has_boost boolean;
  _songs_today integer;
  _result jsonb;
BEGIN
  -- Check 80% completion
  _completed := (_play_duration / NULLIF(_song_duration, 0)) >= 0.8;
  
  IF NOT _completed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Song not completed (80% required)');
  END IF;

  -- Get or create user earnings record
  INSERT INTO user_earnings (user_id, balance, total_earned, songs_listened_today, last_listen_date)
  VALUES (_user_id, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    songs_listened_today = CASE 
      WHEN user_earnings.last_listen_date < CURRENT_DATE THEN 0
      ELSE user_earnings.songs_listened_today
    END,
    last_listen_date = CURRENT_DATE;

  -- Check daily limit (150 songs)
  SELECT songs_listened_today INTO _songs_today FROM user_earnings WHERE user_id = _user_id;
  IF _songs_today >= 150 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Daily listening limit reached (150 songs)');
  END IF;

  -- Check for active boost
  SELECT EXISTS(
    SELECT 1 FROM share_boosts 
    WHERE user_id = _user_id AND boost_expiry > now()
  ) INTO _has_boost;

  _reward := CASE WHEN _has_boost THEN 3.0 ELSE 1.5 END;

  -- Insert listening history
  INSERT INTO listening_history (user_id, song_id, play_duration_seconds, song_duration_seconds, completed, reward_given, reward_amount)
  VALUES (_user_id, _song_id, _play_duration, _song_duration, true, true, _reward);

  -- Update earnings
  UPDATE user_earnings SET
    balance = balance + _reward,
    total_earned = total_earned + _reward,
    songs_listened_today = songs_listened_today + 1,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'reward', _reward, 
    'boosted', _has_boost,
    'songs_today', _songs_today + 1
  );
END;
$$;
