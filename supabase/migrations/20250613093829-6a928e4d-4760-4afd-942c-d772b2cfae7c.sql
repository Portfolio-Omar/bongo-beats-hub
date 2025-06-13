
-- Create RLS policy to allow authenticated users to upload videos
CREATE POLICY "Allow authenticated users to upload videos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'music_videos');

-- Create RLS policy to allow public access to view videos
CREATE POLICY "Allow public access to music videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'music_videos');

-- Create RLS policy to allow authenticated users to update video metadata
CREATE POLICY "Allow authenticated users to update video metadata" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'music_videos');

-- Create RLS policy to allow authenticated users to delete videos
CREATE POLICY "Allow authenticated users to delete videos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'music_videos');
