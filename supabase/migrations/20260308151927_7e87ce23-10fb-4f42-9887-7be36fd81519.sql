
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog comments" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.blog_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
