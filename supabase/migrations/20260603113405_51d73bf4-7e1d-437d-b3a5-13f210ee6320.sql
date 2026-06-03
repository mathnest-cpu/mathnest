
-- 1. Profiles: subscription columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS billing_cycle_end timestamptz,
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active';

-- Relax the strict profile self-update policy so subscription fields are writable by the owner.
-- (Previous policy froze grade & email; we keep that protection but allow other fields.)
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
);

-- 2. Worksheets: is_free_tier flag
ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS is_free_tier boolean NOT NULL DEFAULT false;

-- 3. Replace student SELECT policy with plan-aware version
DROP POLICY IF EXISTS "students read assigned worksheets" ON public.worksheets;
CREATE POLICY "students read assigned worksheets"
ON public.worksheets
FOR SELECT
TO authenticated
USING (
  (SELECT grade FROM public.profiles WHERE id = auth.uid()) = ANY (assigned_grades)
  AND (
    is_free_tier = true
    OR (SELECT plan FROM public.profiles WHERE id = auth.uid()) = 'paid'
  )
);
