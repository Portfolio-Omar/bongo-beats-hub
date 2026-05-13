
-- Podcasts table
CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INTEGER,
  tags TEXT[] DEFAULT '{}',
  author_name TEXT,
  author_id UUID,
  published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view published podcasts" ON public.podcasts
  FOR SELECT USING (published = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage podcasts" ON public.podcasts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Comments
CREATE TABLE public.podcast_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.podcast_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read podcast comments" ON public.podcast_comments FOR SELECT USING (true);
CREATE POLICY "Auth users insert podcast comments" ON public.podcast_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own podcast comments" ON public.podcast_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- Likes
CREATE TABLE public.podcast_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(podcast_id, user_id)
);
ALTER TABLE public.podcast_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read podcast likes" ON public.podcast_likes FOR SELECT USING (true);
CREATE POLICY "Auth users like" ON public.podcast_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.podcast_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Triggers to keep counts
CREATE OR REPLACE FUNCTION public.update_podcast_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    UPDATE public.podcasts SET like_count = like_count + 1 WHERE id = NEW.podcast_id;
    RETURN NEW;
  ELSIF TG_OP='DELETE' THEN
    UPDATE public.podcasts SET like_count = GREATEST(like_count - 1,0) WHERE id = OLD.podcast_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_podcast_likes
AFTER INSERT OR DELETE ON public.podcast_likes
FOR EACH ROW EXECUTE FUNCTION public.update_podcast_like_count();

CREATE OR REPLACE FUNCTION public.update_podcast_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    UPDATE public.podcasts SET comment_count = comment_count + 1 WHERE id = NEW.podcast_id;
    RETURN NEW;
  ELSIF TG_OP='DELETE' THEN
    UPDATE public.podcasts SET comment_count = GREATEST(comment_count - 1,0) WHERE id = OLD.podcast_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_podcast_comments
AFTER INSERT OR DELETE ON public.podcast_comments
FOR EACH ROW EXECUTE FUNCTION public.update_podcast_comment_count();

-- View / download incrementers
CREATE OR REPLACE FUNCTION public.increment_podcast_view(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.podcasts SET view_count = view_count + 1 WHERE id = _id; END; $$;

CREATE OR REPLACE FUNCTION public.increment_podcast_download(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.podcasts SET download_count = download_count + 1 WHERE id = _id; END; $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('podcasts', 'podcasts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read podcast files" ON storage.objects
  FOR SELECT USING (bucket_id = 'podcasts');
CREATE POLICY "Admin upload podcast files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'podcasts' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update podcast files" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'podcasts' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete podcast files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'podcasts' AND has_role(auth.uid(), 'admin'));
