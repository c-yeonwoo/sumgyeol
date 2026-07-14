-- P0/P1 guards: gender roles, daily 1 free send, active pool, expiry, tickets stub

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS height_cm int CHECK (height_cm IS NULL OR (height_cm BETWEEN 120 AND 230)),
  ADD COLUMN IF NOT EXISTS ticket_balance int NOT NULL DEFAULT 0 CHECK (ticket_balance >= 0);

CREATE INDEX IF NOT EXISTS profiles_last_active_idx
  ON public.profiles(last_active_at DESC NULLS LAST)
  WHERE onboarded = true;

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS filter_kind text
    CHECK (filter_kind IS NULL OR filter_kind IN ('age_band', 'region', 'height')),
  ADD COLUMN IF NOT EXISTS filter_value text;

CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.profiles
  SET last_active_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;

CREATE OR REPLACE FUNCTION public.expire_stale_deliveries()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  UPDATE public.mission_deliveries
  SET status = 'expired'
  WHERE status = 'delivered'
    AND reply_body IS NULL
    AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_deliveries() TO authenticated;

-- Replace any prior signatures
DROP FUNCTION IF EXISTS public.deliver_mission(bigint);
DROP FUNCTION IF EXISTS public.deliver_mission(bigint, boolean, text, text);

CREATE OR REPLACE FUNCTION public.deliver_mission(
  p_mission_id bigint,
  p_use_ticket boolean DEFAULT false,
  p_filter_kind text DEFAULT NULL,
  p_filter_value text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_sender_gender text;
  v_mission public.missions%ROWTYPE;
  v_receiver uuid;
  v_delivery_id bigint;
  v_send_count int;
  v_recv_cap int := 8;
  v_send_free_cap int := 1;
  v_tickets int;
  v_window interval;
  v_windows interval[] := ARRAY[
    interval '48 hours',
    interval '7 days',
    interval '30 days',
    NULL
  ];
  v_i int;
  v_age_min int;
  v_age_max int;
  v_height_min int;
  v_height_max int;
  v_year_now int := EXTRACT(YEAR FROM now())::int;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT gender, ticket_balance INTO v_sender_gender, v_tickets
  FROM public.profiles WHERE id = v_sender;

  IF v_sender_gender IS DISTINCT FROM 'female' THEN
    RAISE EXCEPTION 'only female can send';
  END IF;

  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id;
  IF NOT FOUND OR v_mission.sender_id <> v_sender THEN
    RAISE EXCEPTION 'mission not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.mission_deliveries WHERE mission_id = p_mission_id) THEN
    RAISE EXCEPTION 'already delivered';
  END IF;

  IF p_filter_kind IS NOT NULL THEN
    IF p_filter_kind NOT IN ('age_band', 'region', 'height') THEN
      RAISE EXCEPTION 'invalid filter';
    END IF;
    IF p_filter_value IS NULL OR length(trim(p_filter_value)) = 0 THEN
      RAISE EXCEPTION 'invalid filter';
    END IF;
    UPDATE public.missions
    SET filter_kind = p_filter_kind, filter_value = trim(p_filter_value)
    WHERE id = p_mission_id;
    v_mission.filter_kind := p_filter_kind;
    v_mission.filter_value := trim(p_filter_value);
  END IF;

  SELECT count(*) INTO v_send_count
  FROM public.missions m
  WHERE m.sender_id = v_sender AND m.created_at > date_trunc('day', now());

  -- count includes this mission already inserted by client
  IF v_send_count > v_send_free_cap THEN
    IF NOT COALESCE(p_use_ticket, false) THEN
      RAISE EXCEPTION 'ticket required';
    END IF;
    IF COALESCE(v_tickets, 0) < 1 THEN
      RAISE EXCEPTION 'ticket required';
    END IF;
    UPDATE public.profiles
    SET ticket_balance = ticket_balance - 1
    WHERE id = v_sender AND ticket_balance >= 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ticket required';
    END IF;
  END IF;

  IF v_mission.filter_kind = 'height' AND v_mission.filter_value IS NOT NULL THEN
    v_height_min := split_part(v_mission.filter_value, '-', 1)::int;
    v_height_max := split_part(v_mission.filter_value, '-', 2)::int;
  END IF;

  IF v_mission.filter_kind = 'age_band' AND v_mission.filter_value IS NOT NULL THEN
    v_age_min := split_part(v_mission.filter_value, '-', 1)::int;
    v_age_max := split_part(v_mission.filter_value, '-', 2)::int;
  END IF;

  FOR v_i IN 1..4 LOOP
    v_window := v_windows[v_i];

    SELECT p.id INTO v_receiver
    FROM public.profiles p
    WHERE p.onboarded = true
      AND p.id <> v_sender
      AND p.gender = 'male'
      AND p.birth_year IS NOT NULL
      AND (
        v_window IS NULL
        OR (p.last_active_at IS NOT NULL AND p.last_active_at >= now() - v_window)
      )
      AND (
        v_mission.filter_kind IS NULL
        OR (
          v_mission.filter_kind = 'region'
          AND p.region IS NOT NULL
          AND p.region = v_mission.filter_value
        )
        OR (
          v_mission.filter_kind = 'age_band'
          AND (v_year_now - p.birth_year) BETWEEN v_age_min AND v_age_max
        )
        OR (
          v_mission.filter_kind = 'height'
          AND p.height_cm IS NOT NULL
          AND p.height_cm BETWEEN v_height_min AND v_height_max
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = v_sender AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = v_sender)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.pair_cooldowns c
        WHERE c.until_at > now()
          AND c.user_a = LEAST(v_sender, p.id)
          AND c.user_b = GREATEST(v_sender, p.id)
      )
      AND (
        SELECT count(*) FROM public.mission_deliveries d
        WHERE d.receiver_id = p.id AND d.created_at > date_trunc('day', now())
      ) < v_recv_cap
    ORDER BY random()
    LIMIT 1;

    EXIT WHEN v_receiver IS NOT NULL;
  END LOOP;

  IF v_receiver IS NULL THEN
    RAISE EXCEPTION 'no eligible recipient';
  END IF;

  INSERT INTO public.mission_deliveries (mission_id, sender_id, receiver_id)
  VALUES (p_mission_id, v_sender, v_receiver)
  RETURNING id INTO v_delivery_id;

  RETURN v_delivery_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deliver_mission(bigint, boolean, text, text) TO authenticated;
