
-- Blog reactions table
CREATE TABLE public.blog_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blog_id, user_id, reaction_type)
);

ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog reactions" ON public.blog_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reactions" ON public.blog_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.blog_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Community messages table
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  message TEXT,
  image_url TEXT,
  file_url TEXT,
  file_name TEXT,
  reply_to_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community messages" ON public.community_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.community_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create community-uploads bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('community-uploads', 'community-uploads', true);

-- Storage policies for community-uploads bucket
CREATE POLICY "Anyone can view community uploads" ON storage.objects FOR SELECT USING (bucket_id = 'community-uploads');
CREATE POLICY "Authenticated users can upload to community" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-uploads');
CREATE POLICY "Users can delete own community uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'community-uploads');
