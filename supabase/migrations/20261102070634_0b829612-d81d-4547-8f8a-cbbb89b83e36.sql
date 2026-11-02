DELETE FROM public.song_requests
WHERE created_at > '2026-10-31'
  AND (
    (artist_name = 'Test Artist' AND song_name IN ('Test Song One', 'Test Song Two', 'Test Song Three'))
    OR (artist_name = 'T A' AND song_name IN ('T S O', 'T S T'))
  );