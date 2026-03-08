
-- Daily bonuses table
CREATE TABLE public.daily_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_date date NOT NULL DEFAULT CURRENT_DATE,
  songs_counted integer NOT NULL DEFAULT 0,
  bonus_amount numeric NOT NULL DEFAULT 0,
  tier_reached integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, bonus_date)
);
ALTER TABLE public.daily_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own bonuses" ON public.daily_bonuses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bonuses" ON public.daily_bonuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bonuses" ON public.daily_bonuses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin read all bonuses" ON public.daily_bonuses FOR SELECT USING (true);

-- Ad rewards table
CREATE TABLE public.ad_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_date date NOT NULL DEFAULT CURRENT_DATE,
  ads_watched integer NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date)
);
ALTER TABLE public.ad_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ad rewards" ON public.ad_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ad rewards" ON public.ad_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ad rewards" ON public.ad_rewards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin read all ad rewards" ON public.ad_rewards FOR SELECT USING (true);

-- Promoted songs table
CREATE TABLE public.promoted_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  promoted_by text,
  promotion_type text NOT NULL DEFAULT 'featured',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promoted_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active promotions" ON public.promoted_songs FOR SELECT USING (true);
CREATE POLICY "Admin manage promotions" ON public.promoted_songs FOR ALL USING (true) WITH CHECK (true);

-- Booster tiers table
CREATE TABLE public.booster_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate_per_song numeric NOT NULL,
  duration_hours integer NOT NULL,
  price numeric NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booster_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read booster tiers" ON public.booster_tiers FOR SELECT USING (true);
CREATE POLICY "Admin manage booster tiers" ON public.booster_tiers FOR ALL USING (true) WITH CHECK (true);

-- User booster purchases
CREATE TABLE public.booster_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_tier_id uuid NOT NULL REFERENCES public.booster_tiers(id),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  rate_per_song numeric NOT NULL,
  price_paid numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_status text NOT NULL DEFAULT 'completed',
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.booster_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own purchases" ON public.booster_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own purchases" ON public.booster_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own purchases" ON public.booster_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin read all purchases" ON public.booster_purchases FOR SELECT USING (true);
CREATE POLICY "Admin update purchases" ON public.booster_purchases FOR UPDATE USING (true);

-- Insert default booster tiers
INSERT INTO public.booster_tiers (name, rate_per_song, duration_hours, price, sort_order) VALUES
  ('Starter Booster', 3, 6, 49, 1),
  ('Basic Booster', 5, 12, 99, 2),
  ('Silver Booster', 7, 24, 199, 3),
  ('Gold Booster', 10, 24, 299, 4),
  ('Platinum Booster', 15, 48, 499, 5);

-- Update process_listen_reward to check boosters
CREATE OR REPLACE FUNCTION public.process_listen_reward(_user_id uuid, _song_id uuid, _play_duration numeric, _song_duration numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _completed boolean;
  _reward numeric;
  _has_boost boolean;
  _booster_rate numeric;
  _songs_today integer;
  _bonus_amount numeric := 0;
BEGIN
  _completed := (_play_duration / NULLIF(_song_duration, 0)) >= 0.8;
  IF NOT _completed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Song not completed (80% required)');
  END IF;

  INSERT INTO user_earnings (user_id, balance, total_earned, songs_listened_today, last_listen_date)
  VALUES (_user_id, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    songs_listened_today = CASE 
      WHEN user_earnings.last_listen_date < CURRENT_DATE THEN 0
      ELSE user_earnings.songs_listened_today
    END,
    last_listen_date = CURRENT_DATE;

  SELECT songs_listened_today INTO _songs_today FROM user_earnings WHERE user_id = _user_id;
  IF _songs_today >= 150 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Daily listening limit reached (150 songs)');
  END IF;

  -- Check for active booster purchase first
  SELECT rate_per_song INTO _booster_rate FROM booster_purchases
  WHERE user_id = _user_id AND is_active = true AND expires_at > now()
  ORDER BY rate_per_song DESC LIMIT 1;

  IF _booster_rate IS NOT NULL THEN
    _reward := _booster_rate;
    _has_boost := true;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM share_boosts WHERE user_id = _user_id AND boost_expiry > now()
    ) INTO _has_boost;
    _reward := CASE WHEN _has_boost THEN 3.0 ELSE 1.5 END;
  END IF;

  INSERT INTO listening_history (user_id, song_id, play_duration_seconds, song_duration_seconds, completed, reward_given, reward_amount)
  VALUES (_user_id, _song_id, _play_duration, _song_duration, true, true, _reward);

  UPDATE user_earnings SET
    balance = balance + _reward,
    total_earned = total_earned + _reward,
    songs_listened_today = songs_listened_today + 1,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Daily bonus check
  _songs_today := _songs_today + 1;
  INSERT INTO daily_bonuses (user_id, bonus_date, songs_counted, tier_reached, bonus_amount)
  VALUES (_user_id, CURRENT_DATE, _songs_today, 0, 0)
  ON CONFLICT (user_id, bonus_date) DO UPDATE SET songs_counted = _songs_today;

  IF _songs_today = 10 THEN
    _bonus_amount := 5;
    UPDATE daily_bonuses SET tier_reached = 1, bonus_amount = 5 WHERE user_id = _user_id AND bonus_date = CURRENT_DATE;
    UPDATE user_earnings SET balance = balance + 5, total_earned = total_earned + 5 WHERE user_id = _user_id;
  ELSIF _songs_today = 20 THEN
    _bonus_amount := 10;
    UPDATE daily_bonuses SET tier_reached = 2, bonus_amount = bonus_amount + 10 WHERE user_id = _user_id AND bonus_date = CURRENT_DATE;
    UPDATE user_earnings SET balance = balance + 10, total_earned = total_earned + 10 WHERE user_id = _user_id;
  END IF;

  -- Expire old boosters
  UPDATE booster_purchases SET is_active = false WHERE user_id = _user_id AND expires_at <= now() AND is_active = true;

  RETURN jsonb_build_object(
    'success', true, 
    'reward', _reward, 
    'boosted', _has_boost,
    'songs_today', _songs_today,
    'daily_bonus', _bonus_amount
  );
END;
$$;
