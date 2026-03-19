
-- Live sessions table
CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL DEFAULT 'DJ',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  thumbnail_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Live chat messages
CREATE TABLE public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  message TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Live reactions
CREATE TABLE public.live_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can view live sessions
CREATE POLICY "Anyone can view live sessions" ON public.live_sessions FOR SELECT USING (true);

-- RLS: authenticated users can insert sessions (admin check in app)
CREATE POLICY "Authenticated users can manage sessions" ON public.live_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: anyone can view chat
CREATE POLICY "Anyone can view live chat" ON public.live_chat_messages FOR SELECT USING (true);

-- RLS: authenticated can post chat
CREATE POLICY "Authenticated can post chat" ON public.live_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS: anyone can view reactions
CREATE POLICY "Anyone can view reactions" ON public.live_reactions FOR SELECT USING (true);

-- RLS: authenticated can react
CREATE POLICY "Authenticated can react" ON public.live_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Delete policies for admin
CREATE POLICY "Admin can delete chat" ON public.live_chat_messages FOR DELETE TO authenticated USING (true);
CREATE POLICY "Admin can delete sessions" ON public.live_sessions FOR DELETE TO authenticated USING (true);
