
-- Enums
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'revoked');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  country TEXT,
  timezone TEXT,
  grade INTEGER CHECK (grade BETWEEN 3 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Invites
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  email TEXT NOT NULL,
  full_name TEXT,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 10),
  country TEXT,
  status invite_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invites_email ON public.invites(lower(email));
CREATE INDEX idx_invites_token ON public.invites(token);

-- Worksheets
CREATE TABLE public.worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 10),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;

-- Assignments (when null student_id, assignment is grade-wide)
CREATE TABLE public.worksheet_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grade INTEGER CHECK (grade BETWEEN 3 AND 10),
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (student_id IS NOT NULL OR grade IS NOT NULL)
);
ALTER TABLE public.worksheet_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_student ON public.worksheet_assignments(student_id);
CREATE INDEX idx_wa_grade ON public.worksheet_assignments(grade);

-- Auto-create profile + assign role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_is_teacher BOOLEAN;
BEGIN
  v_is_teacher := lower(NEW.email) = lower('Nisha.ssc.salhotra@gmail.com');

  -- Find a matching pending invite for student
  SELECT * INTO v_invite FROM public.invites
  WHERE lower(email) = lower(NEW.email) AND status = 'pending'
  ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, country, grade)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', v_invite.full_name),
    v_invite.country,
    CASE WHEN v_is_teacher THEN NULL ELSE v_invite.grade END
  );

  IF v_is_teacher THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'teacher')
    ON CONFLICT DO NOTHING;
  ELSIF v_invite.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;
    UPDATE public.invites
      SET status = 'accepted', accepted_by = NEW.id, accepted_at = now()
      WHERE id = v_invite.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS policies
-- profiles
CREATE POLICY "users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "teacher reads all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "teacher updates any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher'));

-- user_roles
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "teacher reads all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));

-- invites
CREATE POLICY "teacher manages invites" ON public.invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- worksheets
CREATE POLICY "teacher manages worksheets" ON public.worksheets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "students read assigned worksheets" ON public.worksheets
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.worksheet_assignments wa
      LEFT JOIN public.profiles p ON p.id = auth.uid()
      WHERE wa.worksheet_id = worksheets.id
      AND (wa.student_id = auth.uid() OR wa.grade = p.grade)
    )
  );

-- worksheet_assignments
CREATE POLICY "teacher manages assignments" ON public.worksheet_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "students read own assignments" ON public.worksheet_assignments
  FOR SELECT TO authenticated USING (
    student_id = auth.uid()
    OR grade = (SELECT grade FROM public.profiles WHERE id = auth.uid())
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('worksheets', 'worksheets', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "teacher manages worksheet files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'worksheets' AND public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (bucket_id = 'worksheets' AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "students read assigned worksheet files" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'worksheets'
    AND EXISTS (
      SELECT 1 FROM public.worksheets w
      JOIN public.worksheet_assignments wa ON wa.worksheet_id = w.id
      LEFT JOIN public.profiles p ON p.id = auth.uid()
      WHERE w.storage_path = storage.objects.name
      AND (wa.student_id = auth.uid() OR wa.grade = p.grade)
    )
  );
