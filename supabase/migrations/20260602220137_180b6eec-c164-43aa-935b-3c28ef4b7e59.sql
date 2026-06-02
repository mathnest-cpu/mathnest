-- Remove student result upload feature
DROP TABLE IF EXISTS public.student_results CASCADE;

-- Drop any storage.objects policies tied to the student-results bucket
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%student-results%' OR with_check ILIKE '%student-results%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;