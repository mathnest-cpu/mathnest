-- Fix storage policy: require is_free_tier OR paid plan, matching worksheets table RLS
DROP POLICY IF EXISTS "students read assigned worksheet files" ON storage.objects;
CREATE POLICY "students read assigned worksheet files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'worksheets'
  AND EXISTS (
    SELECT 1
    FROM public.worksheets w
    JOIN public.worksheet_assignments wa ON wa.worksheet_id = w.id
    LEFT JOIN public.profiles p ON p.id = auth.uid()
    WHERE w.storage_path = storage.objects.name
      AND (wa.student_id = auth.uid() OR wa.grade = p.grade)
      AND (w.is_free_tier = true OR p.plan = 'paid')
  )
);

-- Fix teacher policy to reference private.has_role explicitly (before dropping public.has_role)
DROP POLICY IF EXISTS "teacher manages worksheet files" ON storage.objects;
CREATE POLICY "teacher manages worksheet files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'worksheets' AND private.has_role(auth.uid(), 'teacher'::public.app_role))
WITH CHECK (bucket_id = 'worksheets' AND private.has_role(auth.uid(), 'teacher'::public.app_role));

-- Drop the public.has_role duplicate so authenticated users can't query arbitrary roles
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
