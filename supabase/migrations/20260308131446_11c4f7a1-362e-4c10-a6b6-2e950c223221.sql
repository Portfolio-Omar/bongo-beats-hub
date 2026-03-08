
-- Update process_listen_reward to check registration
CREATE OR REPLACE FUNCTION public.process_listen_reward(_user_id uuid, _song_id uuid, _play_duration numeric, _song_duration numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _completed boolean;
  _reward numeric;
  _has_boost boolean;
  _booster_rate numeric;
  _songs_today integer;
  _bonus_amount numeric := 0;
  _referral_bonus boolean := false;
  _is_registered boolean;
BEGIN
  -- Check if user has verified registration
  SELECT public.is_registered_user(_user_id) INTO _is_registered;
  IF NOT _is_registered THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Registration payment required. Pay KSh 150 to start earning.');
  END IF;

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

  UPDATE referrals SET referred_songs_count = referred_songs_count + 1
  WHERE referred_id = _user_id AND bonus_paid = false;

  UPDATE referrals SET bonus_paid = true
  WHERE referred_id = _user_id AND bonus_paid = false AND referred_songs_count >= 10
  RETURNING true INTO _referral_bonus;

  IF _referral_bonus THEN
    UPDATE user_earnings SET
      balance = balance + 10,
      total_earned = total_earned + 10
    WHERE user_id = (SELECT referrer_id FROM referrals WHERE referred_id = _user_id LIMIT 1);
  END IF;

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
