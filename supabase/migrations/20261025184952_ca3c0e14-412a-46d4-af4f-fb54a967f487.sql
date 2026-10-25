ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'playlist',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_color text;

-- Keep values sane
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playlists_type_check'
  ) THEN
    ALTER TABLE public.playlists ADD CONSTRAINT playlists_type_check CHECK (type IN ('playlist', 'collection'));
  END IF;
END $$;

-- Helpful index for the library listing (pinned first, newest first)
CREATE INDEX IF NOT EXISTS playlists_user_type_pinned_idx
  ON public.playlists (user_id, type, pinned DESC, created_at DESC);