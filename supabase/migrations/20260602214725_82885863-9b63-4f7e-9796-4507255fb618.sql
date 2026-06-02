CREATE TABLE public.worksheet_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  student_email text NOT NULL,
  worksheet_title text NOT NULL,
  worksheet_class text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.worksheet_results TO anon;
GRANT SELECT, INSERT ON public.worksheet_results TO authenticated;
GRANT ALL ON public.worksheet_results TO service_role;

CREATE INDEX idx_worksheet_results_email ON public.worksheet_results (lower(student_email));
CREATE INDEX idx_worksheet_results_completed_at ON public.worksheet_results (completed_at DESC);

ALTER TABLE public.worksheet_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_insert"
  ON public.worksheet_results
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "student_select_own"
  ON public.worksheet_results
  FOR SELECT
  USING (lower(student_email) = lower(auth.email()));

CREATE POLICY "teacher_select_all"
  ON public.worksheet_results
  FOR SELECT
  USING (private.has_role(auth.uid(), 'teacher'::app_role));
