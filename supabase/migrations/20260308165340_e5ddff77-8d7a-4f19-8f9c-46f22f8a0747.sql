
-- Function to increment short view count
CREATE OR REPLACE FUNCTION public.increment_short_view(_short_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shorts
  SET view_count = view_count + 1
  WHERE id = _short_id;
END;
$$;

-- Add comment_count column to shorts
ALTER TABLE public.shorts ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

-- Function to sync like_count on shorts table
CREATE OR REPLACE FUNCTION public.update_short_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET like_count = like_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to sync comment_count on shorts table
CREATE OR REPLACE FUNCTION public.update_short_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET comment_count = comment_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers
CREATE TRIGGER on_short_like_change
AFTER INSERT OR DELETE ON public.short_likes
FOR EACH ROW EXECUTE FUNCTION public.update_short_like_count();

CREATE TRIGGER on_short_comment_change
AFTER INSERT OR DELETE ON public.short_comments
FOR EACH ROW EXECUTE FUNCTION public.update_short_comment_count();
