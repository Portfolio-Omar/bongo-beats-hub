DROP POLICY "Host can update session" ON public.listen_sessions;
CREATE POLICY "Host can update session" ON public.listen_sessions FOR UPDATE TO authenticated
USING (host_id = auth.uid())
WITH CHECK (
  host_id = auth.uid()
  OR (SELECT s.host_id FROM public.listen_sessions s WHERE s.id = listen_sessions.id) = auth.uid()
);

DROP POLICY "Users update own presence" ON public.listen_session_participants;
CREATE POLICY "Users update own presence" ON public.listen_session_participants FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.listen_sessions s WHERE s.id = session_id AND s.host_id = auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.listen_sessions s WHERE s.id = session_id AND s.host_id = auth.uid())
);