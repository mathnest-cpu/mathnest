DROP POLICY IF EXISTS "students read their sessions" ON public.sessions;
CREATE POLICY "students read their sessions" ON public.sessions
FOR SELECT TO authenticated
USING (
  (student_id = auth.uid())
  OR (student_id IS NULL AND grade = (SELECT grade FROM public.profiles WHERE id = auth.uid()))
);