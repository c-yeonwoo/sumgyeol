-- 1. Restrict follows SELECT to authenticated users
DROP POLICY IF EXISTS "follows viewable by everyone" ON public.follows;
CREATE POLICY "follows viewable by authenticated"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

-- 2. Restrict profiles SELECT to authenticated users
DROP POLICY IF EXISTS "profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Restrict answer photo storage reads: only owner or photos referenced by a public answer
DROP POLICY IF EXISTS "answer photos publicly readable via direct path" ON storage.objects;

CREATE POLICY "answer photos readable when owner or public answer"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'answers'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.answers a
        WHERE a.visibility = 'public'
          AND EXISTS (
            SELECT 1 FROM unnest(a.photos) p
            WHERE p LIKE '%/' || storage.objects.name
          )
      )
    )
  );