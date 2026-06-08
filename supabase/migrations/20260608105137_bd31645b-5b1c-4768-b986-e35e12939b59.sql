
-- 1. Add student_id column (nullable to preserve anon GitHub Pages submissions)
ALTER TABLE public.worksheet_results
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS worksheet_results_student_id_idx
  ON public.worksheet_results(student_id);

-- 2. Backfill existing rows by matching student email to profiles
UPDATE public.worksheet_results wr
   SET student_id = p.id
  FROM public.profiles p
 WHERE wr.student_id IS NULL
   AND lower(wr.student_email) = lower(p.email);

-- 3. Trigger to auto-populate student_id from auth.uid() on insert
CREATE OR REPLACE FUNCTION public.set_worksheet_result_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.student_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_worksheet_result_student_id ON public.worksheet_results;
CREATE TRIGGER trg_set_worksheet_result_student_id
  BEFORE INSERT ON public.worksheet_results
  FOR EACH ROW EXECUTE FUNCTION public.set_worksheet_result_student_id();

-- 4. Replace the email-match SELECT policy with a student_id-based one
DROP POLICY IF EXISTS student_select_own ON public.worksheet_results;

CREATE POLICY student_select_own
  ON public.worksheet_results
  FOR SELECT
  TO authenticated
  USING (student_id IS NOT NULL AND student_id = auth.uid());
