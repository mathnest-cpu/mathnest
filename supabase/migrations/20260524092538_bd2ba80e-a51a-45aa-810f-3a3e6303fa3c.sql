
ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS drive_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS assigned_grades integer[] NOT NULL DEFAULT '{}';

ALTER TABLE public.worksheets ALTER COLUMN storage_path DROP NOT NULL;
ALTER TABLE public.worksheets ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE public.worksheets ALTER COLUMN grade DROP NOT NULL;

-- Backfill assigned_grades from legacy grade column
UPDATE public.worksheets
  SET assigned_grades = ARRAY[grade]
  WHERE (assigned_grades IS NULL OR array_length(assigned_grades, 1) IS NULL)
    AND grade IS NOT NULL;

CREATE INDEX IF NOT EXISTS worksheets_assigned_grades_idx
  ON public.worksheets USING gin (assigned_grades);

-- Replace student read policy to use assigned_grades array
DROP POLICY IF EXISTS "students read assigned worksheets" ON public.worksheets;

CREATE POLICY "students read assigned worksheets"
ON public.worksheets
FOR SELECT
TO authenticated
USING (
  (SELECT profiles.grade FROM public.profiles WHERE profiles.id = auth.uid()) = ANY (assigned_grades)
);
