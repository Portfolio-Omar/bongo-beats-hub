
-- Fix blog RLS: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can delete blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow public read access to published blogs" ON public.blogs;

CREATE POLICY "Anyone can read published blogs" ON public.blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can insert blogs" ON public.blogs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update blogs" ON public.blogs FOR UPDATE USING (true);
CREATE POLICY "Admins can delete blogs" ON public.blogs FOR DELETE USING (true);

-- Song ratings table
CREATE TABLE IF NOT EXISTS public.song_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(song_id, user_id)
);
ALTER TABLE public.song_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ratings" ON public.song_ratings FOR SELECT USING (true);
CREATE POLICY "Auth users can insert ratings" ON public.song_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can update own ratings" ON public.song_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own ratings" ON public.song_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Player themes table  
CREATE TABLE IF NOT EXISTS public.player_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  wallpaper_url text NOT NULL,
  overlay_color text DEFAULT 'rgba(0,0,0,0.5)',
  accent_color text DEFAULT '#d4af37',
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.player_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read themes" ON public.player_themes FOR SELECT USING (true);
CREATE POLICY "Admin can manage themes" ON public.player_themes FOR ALL USING (true) WITH CHECK (true);

-- User theme preferences
CREATE TABLE IF NOT EXISTS public.user_theme_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES public.player_themes(id) ON DELETE SET NULL,
  custom_wallpaper_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own prefs" ON public.user_theme_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.user_theme_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.user_theme_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Insert 10 default player themes
INSERT INTO public.player_themes (name, wallpaper_url, overlay_color, accent_color, is_default, sort_order) VALUES
('Midnight Galaxy', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80', 'rgba(0,0,20,0.6)', '#6366f1', true, 1),
('Sunset Vibes', 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80', 'rgba(30,10,0,0.5)', '#f97316', false, 2),
('Ocean Waves', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80', 'rgba(0,20,30,0.5)', '#06b6d4', false, 3),
('Neon City', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80', 'rgba(10,0,20,0.6)', '#e879f9', false, 4),
('Forest Green', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80', 'rgba(0,15,5,0.5)', '#22c55e', false, 5),
('Golden Hour', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80', 'rgba(20,15,0,0.5)', '#d4af37', false, 6),
('Arctic Aurora', 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80', 'rgba(0,10,20,0.5)', '#34d399', false, 7),
('Desert Storm', 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80', 'rgba(20,15,10,0.5)', '#fbbf24', false, 8),
('Cherry Blossom', 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80', 'rgba(20,5,10,0.5)', '#fb7185', false, 9),
('Deep Space', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80', 'rgba(0,0,10,0.7)', '#818cf8', false, 10);
