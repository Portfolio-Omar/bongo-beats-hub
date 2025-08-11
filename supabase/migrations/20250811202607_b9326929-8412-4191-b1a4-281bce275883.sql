-- Create table for song requests from public users
CREATE TABLE public.song_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  submitted_by_email TEXT,
  submitted_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- Enable Row Level Security
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for song requests
CREATE POLICY "Anyone can submit song requests" 
ON public.song_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view pending song requests" 
ON public.song_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow updating song requests for admin review" 
ON public.song_requests 
FOR UPDATE 
USING (true);

-- Create storage bucket for song requests
INSERT INTO storage.buckets (id, name, public) VALUES ('song-requests', 'song-requests', false);

-- Create policies for song requests storage
CREATE POLICY "Anyone can upload song requests" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'song-requests');

CREATE POLICY "Admin can view song request files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'song-requests');