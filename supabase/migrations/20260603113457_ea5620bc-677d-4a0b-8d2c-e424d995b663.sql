
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND NOT (grade IS DISTINCT FROM (SELECT p.grade FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (email IS DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (plan IS DISTINCT FROM (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (plan_status IS DISTINCT FROM (SELECT p.plan_status FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (subscription_id IS DISTINCT FROM (SELECT p.subscription_id FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (billing_cycle_end IS DISTINCT FROM (SELECT p.billing_cycle_end FROM public.profiles p WHERE p.id = auth.uid()))
);
