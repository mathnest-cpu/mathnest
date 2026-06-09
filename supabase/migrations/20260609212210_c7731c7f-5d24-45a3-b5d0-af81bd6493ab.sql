
-- Force trigger to ignore client-supplied student_id when no authenticated session
CREATE OR REPLACE FUNCTION public.set_worksheet_result_student_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    -- Anonymous insert (e.g. GitHub Pages worksheet): never allow attribution to a real account
    NEW.student_id := NULL;
  ELSE
    -- Authenticated insert: always attribute to the authenticated user, ignore client-supplied value
    NEW.student_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Tighten insert policy WITH CHECK to defend in depth alongside the trigger
DROP POLICY IF EXISTS "allow_public_insert" ON public.worksheet_results;

CREATE POLICY "anon_insert_unattributed"
  ON public.worksheet_results
  FOR INSERT
  TO anon
  WITH CHECK (student_id IS NULL);

CREATE POLICY "authenticated_insert_self"
  ON public.worksheet_results
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id IS NULL OR student_id = auth.uid());
