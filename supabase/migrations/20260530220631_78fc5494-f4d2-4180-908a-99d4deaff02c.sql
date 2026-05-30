
-- Storage bucket for student PDF submissions (private; signed URLs used to view)
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-results', 'student-results', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: students upload to their own folder (prefix = auth.uid())
CREATE POLICY "students upload own results"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-results'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "students read own results"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'student-results'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "teacher reads all results files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'student-results'
  AND private.has_role(auth.uid(), 'teacher'::app_role)
);

-- Table for submission metadata
CREATE TABLE public.student_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text,
  worksheet_id uuid NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  worksheet_title text,
  drive_url text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, worksheet_id)
);

GRANT SELECT, INSERT ON public.student_results TO authenticated;
GRANT ALL ON public.student_results TO service_role;

ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students insert own result"
ON public.student_results FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "students read own results"
ON public.student_results FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "teacher reads all results"
ON public.student_results FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'teacher'::app_role));
