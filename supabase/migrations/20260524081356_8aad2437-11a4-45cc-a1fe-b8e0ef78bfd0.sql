
-- 1. Lock down user_roles: only teachers can insert/update/delete
CREATE POLICY "teachers manage roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "teachers manage roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "teachers manage roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- 2. Prevent students from changing immutable fields (grade, email, id) on their own profile
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND grade IS NOT DISTINCT FROM (SELECT grade FROM public.profiles WHERE id = auth.uid())
    AND email IS NOT DISTINCT FROM (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- 3. Profiles INSERT policy: only self, and teachers
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "teachers insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- 4. Revoke direct EXECUTE on SECURITY DEFINER helpers from app roles.
--    They are still callable from RLS policies and triggers (run as definer/postgres).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
