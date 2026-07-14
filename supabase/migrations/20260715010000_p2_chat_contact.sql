-- P2: chat message cap + mutual contact handoff

ALTER TABLE public.mission_threads
  ADD COLUMN IF NOT EXISTS message_cap int NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sender_contact text,
  ADD COLUMN IF NOT EXISTS receiver_contact text;

CREATE OR REPLACE FUNCTION public.send_mission_message(
  p_thread_id bigint,
  p_body text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_thread public.mission_threads%ROWTYPE;
  v_delivery public.mission_deliveries%ROWTYPE;
  v_count int;
  v_msg_id bigint;
  v_body text := trim(p_body);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF v_body IS NULL OR length(v_body) < 1 OR length(v_body) > 500 THEN
    RAISE EXCEPTION 'invalid message';
  END IF;

  SELECT * INTO v_thread FROM public.mission_threads WHERE id = p_thread_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread not found';
  END IF;

  IF v_thread.closed_at IS NOT NULL OR v_thread.expires_at < now() THEN
    RAISE EXCEPTION 'thread closed';
  END IF;

  SELECT * INTO v_delivery FROM public.mission_deliveries WHERE id = v_thread.delivery_id;
  IF v_delivery.sender_id <> v_uid AND v_delivery.receiver_id <> v_uid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_delivery.unlocked_at IS NULL THEN
    RAISE EXCEPTION 'not unlocked';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.mission_messages WHERE thread_id = p_thread_id;

  IF v_count >= COALESCE(v_thread.message_cap, 20) THEN
    UPDATE public.mission_threads SET closed_at = now() WHERE id = p_thread_id AND closed_at IS NULL;
    RAISE EXCEPTION 'message cap reached';
  END IF;

  INSERT INTO public.mission_messages (thread_id, sender_id, body)
  VALUES (p_thread_id, v_uid, v_body)
  RETURNING id INTO v_msg_id;

  SELECT count(*) INTO v_count
  FROM public.mission_messages WHERE thread_id = p_thread_id;

  IF v_count >= COALESCE(v_thread.message_cap, 20) THEN
    UPDATE public.mission_threads SET closed_at = now() WHERE id = p_thread_id;
  END IF;

  RETURN v_msg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_mission_message(bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.offer_thread_contact(
  p_thread_id bigint,
  p_contact text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_thread public.mission_threads%ROWTYPE;
  v_delivery public.mission_deliveries%ROWTYPE;
  v_contact text := trim(p_contact);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF v_contact IS NULL OR length(v_contact) < 2 OR length(v_contact) > 80 THEN
    RAISE EXCEPTION 'invalid contact';
  END IF;

  SELECT * INTO v_thread FROM public.mission_threads WHERE id = p_thread_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread not found';
  END IF;

  SELECT * INTO v_delivery FROM public.mission_deliveries WHERE id = v_thread.delivery_id;
  IF v_delivery.unlocked_at IS NULL THEN
    RAISE EXCEPTION 'not unlocked';
  END IF;

  IF v_uid = v_delivery.sender_id THEN
    UPDATE public.mission_threads SET sender_contact = v_contact WHERE id = p_thread_id;
  ELSIF v_uid = v_delivery.receiver_id THEN
    UPDATE public.mission_threads SET receiver_contact = v_contact WHERE id = p_thread_id;
  ELSE
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.offer_thread_contact(bigint, text) TO authenticated;

-- Allow participants to update contact columns via RPC only (no direct UPDATE policy needed)
