-- Make song-requests bucket public so uploaded audio can be played
UPDATE storage.buckets
SET public = true
WHERE id = 'song-requests';

-- Allow client-side admin tools to insert/update songs (no auth layer yet)
-- This matches the existing pattern where many tables are publicly writable.
CREATE POLICY "Allow public full access to songs"
ON public.songs
FOR ALL
USING (true)
WITH CHECK (true);