
-- 1. Profiles parent + performance columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS parent_relationship text,
  ADD COLUMN IF NOT EXISTS low_performance_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_flag boolean NOT NULL DEFAULT false;

-- 2. Invites parent columns
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS parent_relationship text;

-- 3. Update users self-update policy to also lock new performance/parent fields managed server-side
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND NOT (grade IS DISTINCT FROM (SELECT p.grade FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (email IS DISTINCT FROM (SELECT p.email FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (plan IS DISTINCT FROM (SELECT p.plan FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (plan_status IS DISTINCT FROM (SELECT p.plan_status FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (subscription_id IS DISTINCT FROM (SELECT p.subscription_id FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (billing_cycle_end IS DISTINCT FROM (SELECT p.billing_cycle_end FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (low_performance_count IS DISTINCT FROM (SELECT p.low_performance_count FROM profiles p WHERE p.id = auth.uid()))
  AND NOT (performance_flag IS DISTINCT FROM (SELECT p.performance_flag FROM profiles p WHERE p.id = auth.uid()))
);

-- 4. Update handle_new_user to copy parent fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite RECORD;
  v_is_teacher BOOLEAN;
BEGIN
  v_is_teacher := lower(NEW.email) = lower('Nisha.ssc.salhotra@gmail.com');

  SELECT * INTO v_invite FROM public.invites
  WHERE lower(email) = lower(NEW.email) AND status = 'pending'
  ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, country, grade,
    parent_name, parent_email, parent_phone, parent_relationship)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', v_invite.full_name),
    v_invite.country,
    CASE WHEN v_is_teacher THEN NULL ELSE v_invite.grade END,
    v_invite.parent_name,
    v_invite.parent_email,
    v_invite.parent_phone,
    v_invite.parent_relationship
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
$function$;

-- 5. Trigger on worksheet_results to track low scores
CREATE OR REPLACE FUNCTION public.track_low_performance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
  v_new_count integer;
BEGIN
  IF NEW.percentage >= 80 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles
   WHERE lower(email) = lower(NEW.student_email)
   LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
     SET low_performance_count = low_performance_count + 1,
         performance_flag = (low_performance_count + 1) >= 5 OR performance_flag
   WHERE id = v_profile_id
  RETURNING low_performance_count INTO v_new_count;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_worksheet_results_low_perf ON public.worksheet_results;
CREATE TRIGGER trg_worksheet_results_low_perf
AFTER INSERT ON public.worksheet_results
FOR EACH ROW EXECUTE FUNCTION public.track_low_performance();

-- 6. parent_notifications table
CREATE TABLE IF NOT EXISTS public.parent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('score_alert','one_to_one_request')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid NOT NULL
);

GRANT SELECT, INSERT ON public.parent_notifications TO authenticated;
GRANT ALL ON public.parent_notifications TO service_role;

ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers read notifications"
ON public.parent_notifications FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "teachers insert notifications"
ON public.parent_notifications FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'teacher'::app_role) AND sent_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_parent_notifs_student_type_time
  ON public.parent_notifications(student_id, notification_type, sent_at DESC);
