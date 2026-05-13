
-- =========================================================
-- 1. SONGS: remove catch-all write policy
-- =========================================================
DROP POLICY IF EXISTS "Allow public full access to songs" ON public.songs;

CREATE POLICY "Admins can insert songs" ON public.songs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update songs" ON public.songs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete songs" ON public.songs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2. ADMIN-ONLY WRITE POLICIES → require has_role admin
-- =========================================================

-- account_suspensions
DROP POLICY IF EXISTS "Admin manage suspensions" ON public.account_suspensions;
CREATE POLICY "Admin manage suspensions" ON public.account_suspensions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ad_videos
DROP POLICY IF EXISTS "Admin manage ad videos" ON public.ad_videos;
CREATE POLICY "Admin manage ad videos" ON public.ad_videos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- badge_definitions
DROP POLICY IF EXISTS "Admin manage badges" ON public.badge_definitions;
CREATE POLICY "Admin manage badges" ON public.badge_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blogs
DROP POLICY IF EXISTS "Admins can insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete blogs" ON public.blogs;
CREATE POLICY "Admins can insert blogs" ON public.blogs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blogs" ON public.blogs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blogs" ON public.blogs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- booster_purchases admin
DROP POLICY IF EXISTS "Admin read all purchases" ON public.booster_purchases;
DROP POLICY IF EXISTS "Admin update purchases" ON public.booster_purchases;
CREATE POLICY "Admin read all purchases" ON public.booster_purchases
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update purchases" ON public.booster_purchases
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- booster_tiers
DROP POLICY IF EXISTS "Admin manage booster tiers" ON public.booster_tiers;
CREATE POLICY "Admin manage booster tiers" ON public.booster_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- daily_bonuses admin read
DROP POLICY IF EXISTS "Admin read all bonuses" ON public.daily_bonuses;
CREATE POLICY "Admin read all bonuses" ON public.daily_bonuses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- device_fingerprints admin read
DROP POLICY IF EXISTS "Admin read all fingerprints" ON public.device_fingerprints;
CREATE POLICY "Admin read all fingerprints" ON public.device_fingerprints
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ad_rewards admin read
DROP POLICY IF EXISTS "Admin read all ad rewards" ON public.ad_rewards;
CREATE POLICY "Admin read all ad rewards" ON public.ad_rewards
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- feedback delete
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.feedback;
CREATE POLICY "Enable delete for admin users" ON public.feedback
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- listening_history admin read
DROP POLICY IF EXISTS "Admin read all history" ON public.listening_history;
CREATE POLICY "Admin read all history" ON public.listening_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- live_chat_messages admin delete
DROP POLICY IF EXISTS "Admin can delete chat" ON public.live_chat_messages;
CREATE POLICY "Admin can delete chat" ON public.live_chat_messages
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- live_recordings
DROP POLICY IF EXISTS "Admin manage recordings" ON public.live_recordings;
CREATE POLICY "Admin manage recordings" ON public.live_recordings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- live_sessions
DROP POLICY IF EXISTS "Authenticated users can manage sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Admin can delete sessions" ON public.live_sessions;
CREATE POLICY "Admin manage sessions" ON public.live_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- live_song_requests admin
DROP POLICY IF EXISTS "Admin manage requests" ON public.live_song_requests;
DROP POLICY IF EXISTS "Admin delete requests" ON public.live_song_requests;
CREATE POLICY "Admin update requests" ON public.live_song_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete requests" ON public.live_song_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- login_activity admin read
DROP POLICY IF EXISTS "Admin read all login activity" ON public.login_activity;
CREATE POLICY "Admin read all login activity" ON public.login_activity
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- music_videos admin
DROP POLICY IF EXISTS "Allow admin full access" ON public.music_videos;
DROP POLICY IF EXISTS "Allow admin to insert videos" ON public.music_videos;
DROP POLICY IF EXISTS "Allow admin to update videos" ON public.music_videos;
DROP POLICY IF EXISTS "Allow admin to delete videos" ON public.music_videos;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.music_videos;
CREATE POLICY "Admin manage music videos" ON public.music_videos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- player_themes
DROP POLICY IF EXISTS "Admin can manage themes" ON public.player_themes;
CREATE POLICY "Admin can manage themes" ON public.player_themes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- private_messages admin read
DROP POLICY IF EXISTS "Admin read all messages" ON public.private_messages;
CREATE POLICY "Admin read all messages" ON public.private_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- promoted_songs
DROP POLICY IF EXISTS "Admin manage promotions" ON public.promoted_songs;
CREATE POLICY "Admin manage promotions" ON public.promoted_songs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- referrals admin read
DROP POLICY IF EXISTS "Admin read all referrals" ON public.referrals;
CREATE POLICY "Admin read all referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- registration_payments admin
DROP POLICY IF EXISTS "Admin read all payments" ON public.registration_payments;
DROP POLICY IF EXISTS "Admin update payments" ON public.registration_payments;
CREATE POLICY "Admin read all payments" ON public.registration_payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update payments" ON public.registration_payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- security_flags admin
DROP POLICY IF EXISTS "Admin read all security flags" ON public.security_flags;
DROP POLICY IF EXISTS "Admin insert security flags" ON public.security_flags;
DROP POLICY IF EXISTS "Admin update security flags" ON public.security_flags;
DROP POLICY IF EXISTS "Admin delete security flags" ON public.security_flags;
CREATE POLICY "Admin manage security flags" ON public.security_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- share_boosts admin read
DROP POLICY IF EXISTS "Admin read all boosts" ON public.share_boosts;
CREATE POLICY "Admin read all boosts" ON public.share_boosts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- shorts admin
DROP POLICY IF EXISTS "Admin can manage shorts" ON public.shorts;
CREATE POLICY "Admin can manage shorts" ON public.shorts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- song_of_the_week (admin-only writes)
DROP POLICY IF EXISTS "Allow inserting song of the week" ON public.song_of_the_week;
DROP POLICY IF EXISTS "Allow updating song of the week" ON public.song_of_the_week;
DROP POLICY IF EXISTS "Allow selecting song of the week" ON public.song_of_the_week;
CREATE POLICY "Admin insert song of the week" ON public.song_of_the_week
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update song of the week" ON public.song_of_the_week
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete song of the week" ON public.song_of_the_week
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 3. STORAGE: ownership and admin checks
-- =========================================================

-- avatars: users can only update/delete their own (path = uid)
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- community-uploads: users can only delete their own
DROP POLICY IF EXISTS "Users can delete own community uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to community" ON storage.objects;
CREATE POLICY "Authenticated users can upload to community" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users can delete own community uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- blog-images: admin only writes
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their blog images" ON storage.objects;
CREATE POLICY "Admin upload blog images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update blog images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete blog images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

-- music_videos bucket: admin only writes
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update video metadata" ON storage.objects;
CREATE POLICY "Admin upload music videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'music_videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update music videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'music_videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete music videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'music_videos' AND public.has_role(auth.uid(), 'admin'));

-- shorts bucket: admin only writes
DROP POLICY IF EXISTS "Admin can upload shorts" ON storage.objects;
CREATE POLICY "Admin can upload shorts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shorts' AND public.has_role(auth.uid(), 'admin'));

-- live-recordings: admin only
DROP POLICY IF EXISTS "Auth upload live recordings" ON storage.objects;
DROP POLICY IF EXISTS "Auth update live recordings" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete live recordings" ON storage.objects;
CREATE POLICY "Admin upload live recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'live-recordings' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update live recordings" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'live-recordings' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete live recordings" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'live-recordings' AND public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 4. SECURITY DEFINER FUNCTIONS: set search_path, drop insecure
-- =========================================================

DROP FUNCTION IF EXISTS public.admin_login(text);
DROP FUNCTION IF EXISTS public.check_admin();
DROP FUNCTION IF EXISTS public.is_admin(text);

CREATE OR REPLACE FUNCTION public.check_song_exists(_title text, _artist text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  song_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM songs 
    WHERE 
      similarity(lower(title), lower(_title)) > 0.7 
      AND similarity(lower(artist), lower(_artist)) > 0.7
  ) INTO song_exists;
  RETURN song_exists;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_song_view(_song_id uuid, _view_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.song_view_stats (song_id, view_date, view_count)
  VALUES (_song_id, _view_date, 1)
  ON CONFLICT (song_id, view_date) 
  DO UPDATE SET view_count = song_view_stats.view_count + 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_video_view(_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.music_videos
  SET view_count = view_count + 1
  WHERE id = _video_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_short_view(_short_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.shorts
  SET view_count = view_count + 1
  WHERE id = _short_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_short_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET like_count = like_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_short_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET comment_count = comment_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(md5(NEW.user_id::text || now()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(title);
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  slug := trim(both '-' from slug);
  IF slug = '' THEN
    slug := 'untitled';
  END IF;
  RETURN slug;
END;
$function$;
