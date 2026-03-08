
-- Message reactions table
CREATE TABLE public.community_message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.community_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read message reactions" ON public.community_message_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reactions" ON public.community_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.community_message_reactions FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE community_message_reactions;

-- Shorts table
CREATE TABLE public.shorts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  uploaded_by text,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published shorts" ON public.shorts FOR SELECT USING (published = true);
CREATE POLICY "Admin can manage shorts" ON public.shorts FOR ALL USING (true) WITH CHECK (true);

-- Shorts likes
CREATE TABLE public.short_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id uuid NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(short_id, user_id)
);

ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read short likes" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert likes" ON public.short_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.short_likes FOR DELETE USING (auth.uid() = user_id);

-- Shorts comments
CREATE TABLE public.short_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id uuid NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read short comments" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert comments" ON public.short_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.short_comments FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for shorts
INSERT INTO storage.buckets (id, name, public) VALUES ('shorts', 'shorts', true);

CREATE POLICY "Admin can upload shorts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shorts');
CREATE POLICY "Anyone can view shorts" ON storage.objects FOR SELECT USING (bucket_id = 'shorts');

ALTER PUBLICATION supabase_realtime ADD TABLE short_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE short_likes;
