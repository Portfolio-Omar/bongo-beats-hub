
-- Listen events for analytics (drop-off, replayed sections)
CREATE TABLE public.podcast_listen_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id uuid NOT NULL,
  user_id uuid,
  session_id text,
  position_from numeric NOT NULL DEFAULT 0,
  position_to numeric NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'progress',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ple_podcast ON public.podcast_listen_events(podcast_id);
CREATE INDEX idx_ple_user ON public.podcast_listen_events(user_id);
ALTER TABLE public.podcast_listen_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone insert listen events" ON public.podcast_listen_events
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users read own listen events" ON public.podcast_listen_events
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Admins read all listen events" ON public.podcast_listen_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- In-app notifications
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.user_notifications(user_id, read, created_at DESC);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.user_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.user_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.user_notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all notifications" ON public.user_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert notifications" ON public.user_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: notify all users when a podcast is newly published
CREATE OR REPLACE FUNCTION public.notify_new_podcast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.published = true AND (TG_OP = 'INSERT' OR OLD.published = false) THEN
    INSERT INTO public.user_notifications (user_id, type, title, body, link)
    SELECT p.user_id, 'new_podcast',
           'New podcast: ' || NEW.title,
           COALESCE(NEW.description, 'Listen now on Bongo Old Skool'),
           '/podcasts?ep=' || NEW.id::text
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_podcast ON public.podcasts;
CREATE TRIGGER trg_notify_new_podcast
AFTER INSERT OR UPDATE OF published ON public.podcasts
FOR EACH ROW EXECUTE FUNCTION public.notify_new_podcast();
