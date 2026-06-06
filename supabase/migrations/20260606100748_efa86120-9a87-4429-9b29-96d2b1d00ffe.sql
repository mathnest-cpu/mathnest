-- 1. Scope SELECT policies to authenticated users only
DROP POLICY IF EXISTS student_select_own ON public.worksheet_results;
DROP POLICY IF EXISTS teacher_select_all ON public.worksheet_results;

CREATE POLICY student_select_own ON public.worksheet_results
  FOR SELECT TO authenticated
  USING (lower(student_email) = lower(auth.email()));

CREATE POLICY teacher_select_all ON public.worksheet_results
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'::app_role));

-- 2. Add input validation constraints for the public-insert path
ALTER TABLE public.worksheet_results
  DROP CONSTRAINT IF EXISTS worksheet_results_percentage_range,
  DROP CONSTRAINT IF EXISTS worksheet_results_score_range,
  DROP CONSTRAINT IF EXISTS worksheet_results_totalq_range,
  DROP CONSTRAINT IF EXISTS worksheet_results_email_chk,
  DROP CONSTRAINT IF EXISTS worksheet_results_name_chk,
  DROP CONSTRAINT IF EXISTS worksheet_results_title_chk,
  DROP CONSTRAINT IF EXISTS worksheet_results_class_chk;

ALTER TABLE public.worksheet_results
  ADD CONSTRAINT worksheet_results_percentage_range
    CHECK (percentage >= 0 AND percentage <= 100),
  ADD CONSTRAINT worksheet_results_score_range
    CHECK (score >= 0 AND score <= total_questions),
  ADD CONSTRAINT worksheet_results_totalq_range
    CHECK (total_questions > 0 AND total_questions <= 500),
  ADD CONSTRAINT worksheet_results_email_chk
    CHECK (char_length(student_email) BETWEEN 3 AND 254
           AND student_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT worksheet_results_name_chk
    CHECK (char_length(btrim(student_name)) BETWEEN 1 AND 120),
  ADD CONSTRAINT worksheet_results_title_chk
    CHECK (char_length(btrim(worksheet_title)) BETWEEN 1 AND 200),
  ADD CONSTRAINT worksheet_results_class_chk
    CHECK (char_length(btrim(worksheet_class)) BETWEEN 1 AND 50);