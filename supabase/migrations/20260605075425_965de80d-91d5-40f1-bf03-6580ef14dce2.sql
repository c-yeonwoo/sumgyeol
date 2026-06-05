
-- Restrict follows visibility to participants only
DROP POLICY IF EXISTS "follows viewable by authenticated" ON public.follows;

CREATE POLICY "follows viewable by participants"
ON public.follows
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Allow anonymous visitors to read public profile data for shareable links
GRANT SELECT ON public.profiles TO anon;

CREATE POLICY "profiles viewable by anon"
ON public.profiles
FOR SELECT
TO anon
USING (true);
