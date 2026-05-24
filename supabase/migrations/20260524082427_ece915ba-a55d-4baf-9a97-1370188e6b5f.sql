
-- Attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  session_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  notes text,
  marked_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, session_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher manages attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "students read own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE TRIGGER attendance_touch BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, session_date DESC);

-- Sessions (scheduled classes)
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  grade integer,
  student_id uuid,
  meeting_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (grade IS NOT NULL OR student_id IS NOT NULL)
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher manages sessions" ON public.sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "students read their sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR grade = (SELECT grade FROM public.profiles WHERE id = auth.uid())
  );

CREATE TRIGGER sessions_touch BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX idx_sessions_grade ON public.sessions(grade);
CREATE INDEX idx_sessions_student ON public.sessions(student_id);
