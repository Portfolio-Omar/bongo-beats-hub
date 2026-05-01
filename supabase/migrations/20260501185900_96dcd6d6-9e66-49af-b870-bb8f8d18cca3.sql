
-- Live recordings (separate from live_sessions for editing/publishing flow)
CREATE TABLE public.live_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  recording_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  recorded_by uuid,
  is_published boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.live_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published recordings" ON public.live_recordings FOR SELECT USING (is_published = true);
CREATE POLICY "Admin manage recordings" ON public.live_recordings FOR ALL USING (true) WITH CHECK (true);

-- Live song request queue
CREATE TABLE public.live_song_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  song_id uuid,
  song_title text NOT NULL,
  song_artist text,
  message text,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, played, rejected
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.live_song_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view requests" ON public.live_song_requests FOR SELECT USING (true);
CREATE POLICY "Auth users can request" ON public.live_song_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage requests" ON public.live_song_requests FOR UPDATE USING (true);
CREATE POLICY "Admin delete requests" ON public.live_song_requests FOR DELETE USING (true);

-- Listener analytics snapshots
CREATE TABLE public.live_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  viewer_count integer NOT NULL DEFAULT 0,
  reactions_count integer NOT NULL DEFAULT 0,
  chat_messages_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.live_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view analytics" ON public.live_analytics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert analytics" ON public.live_analytics FOR INSERT WITH CHECK (true);

-- Audio rooms (group listening)
CREATE TABLE public.audio_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  host_id uuid NOT NULL,
  current_song_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  participant_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audio_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view rooms" ON public.audio_rooms FOR SELECT USING (true);
CREATE POLICY "Auth create rooms" ON public.audio_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host update room" ON public.audio_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host delete room" ON public.audio_rooms FOR DELETE USING (auth.uid() = host_id);

CREATE TABLE public.audio_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.audio_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE public.audio_room_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view participants" ON public.audio_room_participants FOR SELECT USING (true);
CREATE POLICY "Auth join room" ON public.audio_room_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth leave room" ON public.audio_room_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.audio_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.audio_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audio_room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view room messages" ON public.audio_room_messages FOR SELECT USING (true);
CREATE POLICY "Auth post room messages" ON public.audio_room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Live chat moderation: add deleted flag (soft moderation already supported via DELETE)
ALTER TABLE public.live_chat_messages ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Storage bucket for live recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('live-recordings', 'live-recordings', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read live recordings" ON storage.objects FOR SELECT USING (bucket_id = 'live-recordings');
CREATE POLICY "Auth upload live recordings" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'live-recordings');
CREATE POLICY "Auth update live recordings" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'live-recordings');
CREATE POLICY "Auth delete live recordings" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'live-recordings');

-- Enable realtime for messaging + live tables
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;
ALTER TABLE public.live_song_requests REPLICA IDENTITY FULL;
ALTER TABLE public.audio_room_messages REPLICA IDENTITY FULL;
ALTER TABLE public.audio_room_participants REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_song_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_room_participants;
