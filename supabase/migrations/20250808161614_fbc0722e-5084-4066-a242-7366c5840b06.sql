-- Add download_count column to songs table
ALTER TABLE public.songs 
ADD COLUMN download_count INTEGER DEFAULT 0;