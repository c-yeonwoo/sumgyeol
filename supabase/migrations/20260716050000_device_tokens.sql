-- ---------------------------------------------------------------------------
-- Push notification device tokens
--
-- Stores each user's FCM/APNs device tokens so a server (Edge Function) can
-- deliver push for mission arrivals / replies / no-response prompts. The
-- actual send side (Edge Function + FCM/APNs credentials) is set up separately.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.device_tokens (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;

CREATE POLICY "own device tokens"
  ON public.device_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Upsert helper — client calls this after the native push registration returns
-- a token. SECURITY DEFINER so it can't be spoofed to write another user's row.
CREATE OR REPLACE FUNCTION public.upsert_device_token(p_token text, p_platform text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_platform NOT IN ('ios', 'android', 'web') THEN
    RAISE EXCEPTION 'invalid platform';
  END IF;

  INSERT INTO public.device_tokens (user_id, token, platform)
  VALUES (auth.uid(), p_token, p_platform)
  ON CONFLICT (user_id, token)
  DO UPDATE SET updated_at = now(), platform = EXCLUDED.platform;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_device_token(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.upsert_device_token(text, text) TO authenticated;
