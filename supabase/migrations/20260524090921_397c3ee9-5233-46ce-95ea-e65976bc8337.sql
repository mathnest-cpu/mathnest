CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "teacher reads all profiles" ON public.profiles;
CREATE POLICY "teacher reads all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher updates any profile" ON public.profiles;
CREATE POLICY "teacher updates any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teachers insert profiles" ON public.profiles;
CREATE POLICY "teachers insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher reads all roles" ON public.user_roles;
CREATE POLICY "teacher reads all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teachers manage roles insert" ON public.user_roles;
CREATE POLICY "teachers manage roles insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teachers manage roles update" ON public.user_roles;
CREATE POLICY "teachers manage roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teachers manage roles delete" ON public.user_roles;
CREATE POLICY "teachers manage roles delete" ON public.user_roles
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher manages invites" ON public.invites;
CREATE POLICY "teacher manages invites" ON public.invites
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher manages worksheets" ON public.worksheets;
CREATE POLICY "teacher manages worksheets" ON public.worksheets
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher manages assignments" ON public.worksheet_assignments;
CREATE POLICY "teacher manages assignments" ON public.worksheet_assignments
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher manages attendance" ON public.attendance;
DROP POLICY IF EXISTS "teachers manage attendance" ON public.attendance;
CREATE POLICY "teachers manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "teacher manages sessions" ON public.sessions;
DROP POLICY IF EXISTS "teachers manage sessions" ON public.sessions;
CREATE POLICY "teachers manage sessions" ON public.sessions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'teacher'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;