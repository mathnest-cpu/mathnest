
CREATE OR REPLACE FUNCTION public.set_worksheet_result_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.student_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_worksheet_result_student_id() FROM PUBLIC, anon, authenticated;
