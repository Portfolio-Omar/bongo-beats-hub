
-- Ad videos table for admin-uploaded advertisement videos
CREATE TABLE IF NOT EXISTS public.ad_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_videos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active ad videos" ON public.ad_videos FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage ad videos" ON public.ad_videos FOR ALL USING (true) WITH CHECK (true);
