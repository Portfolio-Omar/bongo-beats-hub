-- Listen Together sessions (Spotify Jam style)
CREATE TABLE public.listen_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  host_id uuid NOT NULL,
  host_name text NOT NULL,
  current_song jsonb,
  queue jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_playing boolean NOT NULL DEFAULT false,
  position_seconds numeric NOT NULL DEFAULT 0,
  state_updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.listen_session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.listen_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  avatar_url text,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE TABLE public.listen_session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.listen_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  avatar_url text,
  message text,
  voice_url text,
  voice_duration numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listen_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listen_session_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listen_session_messages TO authenticated;
GRANT ALL ON public.listen_sessions TO service_role;
GRANT ALL ON public.listen_session_participants TO service_role;
GRANT ALL ON public.listen_session_messages TO service_role;

ALTER TABLE public.listen_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listen_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listen_session_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: anyone signed in can see sessions (needed to browse open sessions);
-- only the host can create, update or delete a session.
CREATE POLICY "Authenticated can view sessions" ON public.listen_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Host can create session" ON public.listen_sessions FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "Host can update session" ON public.listen_sessions FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "Host can delete session" ON public.listen_sessions FOR DELETE TO authenticated USING (host_id = auth.uid());

-- Participants: visible to signed-in users; you manage your own row, the session host can also manage it.
CREATE POLICY "Authenticated can view participants" ON public.listen_session_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join as themselves" ON public.listen_session_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own presence" ON public.listen_session_participants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Leave own seat or host removes" ON public.listen_session_participants FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.listen_sessions s WHERE s.id = session_id AND s.host_id = auth.uid())
);

-- Chat: only people in the session can read; you send as yourself; you or the host can delete.
CREATE POLICY "Participants can view messages" ON public.listen_session_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.listen_session_participants p WHERE p.session_id = session_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users send own messages" ON public.listen_session_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own messages or host moderates" ON public.listen_session_messages FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.listen_sessions s WHERE s.id = session_id AND s.host_id = auth.uid())
);

-- Auto-generate a unique 6-digit join code
CREATE OR REPLACE FUNCTION public.generate_listen_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      NEW.code := lpad((floor(random() * 1000000))::int::text, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.listen_sessions WHERE code = NEW.code AND status = 'active');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER set_listen_code BEFORE INSERT ON public.listen_sessions
FOR EACH ROW EXECUTE FUNCTION public.generate_listen_code();

CREATE OR REPLACE FUNCTION public.update_listen_sessions_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER update_listen_sessions_updated BEFORE UPDATE ON public.listen_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_listen_sessions_updated_at();

-- Realtime sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.listen_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listen_session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listen_session_messages;