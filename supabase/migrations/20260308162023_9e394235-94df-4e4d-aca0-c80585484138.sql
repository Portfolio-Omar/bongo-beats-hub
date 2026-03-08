CREATE POLICY "Auth users can insert shorts"
ON public.shorts
FOR INSERT
TO authenticated
WITH CHECK (true);