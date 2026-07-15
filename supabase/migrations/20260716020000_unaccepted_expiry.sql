-- ---------------------------------------------------------------------------
-- Fix: unaccepted deliveries never expire (launch blocker A4)
--
-- deliver_mission inserts expires_at = NULL and only accept_delivery sets the
-- 12h clock. expire_stale_deliveries() previously handled ONLY accepted-but-
-- unanswered rows, so a mission that no man ever accepts stays 'delivered'
-- forever — it never frees the pool and the sender never learns it went
-- nowhere.
--
-- Decision (PO, 2026-07): keep expiry lazy/on-read for beta (no scheduler), but
-- add a rule so a delivered-but-unaccepted mission auto-expires after 48h. No
-- trust penalty (the man may never have seen it — in-app notif only, no push
-- yet). The sender gets a resend prompt, same as the no-response path.
--
-- Acceptance criteria (assertable):
--  1. a delivery with status='delivered', accepted_at IS NULL, created_at
--     older than 48h becomes 'expired' on the next expire_stale_deliveries().
--  2. that expiry applies NO trust_score penalty to the receiver.
--  3. the sender receives a 'mission_no_response' notification with can_resend.
--  4. the accepted-but-unanswered path (12h, trust -15) is unchanged.
--  5. resend_expired_mission still works on an unaccepted-expired row
--     (status='expired', reply_body IS NULL).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_deliveries()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n int := 0;
  v_body text;
  v_penalty int := 15;
  v_unaccepted_window interval := interval '48 hours';
BEGIN
  -- (1) Accepted but unanswered past the 12h clock: expire + trust penalty.
  FOR r IN
    SELECT d.*
    FROM public.mission_deliveries d
    WHERE d.status = 'delivered'
      AND d.reply_body IS NULL
      AND d.accepted_at IS NOT NULL
      AND d.expires_at IS NOT NULL
      AND d.expires_at < now()
    FOR UPDATE
  LOOP
    UPDATE public.mission_deliveries SET status = 'expired' WHERE id = r.id;

    UPDATE public.profiles
    SET trust_score = GREATEST(0, trust_score - v_penalty)
    WHERE id = r.receiver_id;

    SELECT body INTO v_body FROM public.missions WHERE id = r.mission_id;

    INSERT INTO public.in_app_notifications(user_id, kind, title, body, payload)
    VALUES (
      r.sender_id,
      'mission_no_response',
      '미션에 응하지 않았어요',
      '같은 미션 내용으로 플로티를 다시 보내시겠습니까?',
      jsonb_build_object(
        'delivery_id', r.id,
        'mission_id', r.mission_id,
        'mission_body', v_body,
        'can_resend', true
      )
    );

    n := n + 1;
  END LOOP;

  -- (2) Never accepted within the window: expire, no penalty, resend prompt.
  FOR r IN
    SELECT d.*
    FROM public.mission_deliveries d
    WHERE d.status = 'delivered'
      AND d.reply_body IS NULL
      AND d.accepted_at IS NULL
      AND d.created_at < now() - v_unaccepted_window
    FOR UPDATE
  LOOP
    UPDATE public.mission_deliveries SET status = 'expired' WHERE id = r.id;

    SELECT body INTO v_body FROM public.missions WHERE id = r.mission_id;

    INSERT INTO public.in_app_notifications(user_id, kind, title, body, payload)
    VALUES (
      r.sender_id,
      'mission_no_response',
      '아직 아무도 받지 않았어요',
      '다른 사람에게 다시 보낼 수 있어요.',
      jsonb_build_object(
        'delivery_id', r.id,
        'mission_id', r.mission_id,
        'mission_body', v_body,
        'can_resend', true
      )
    );

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;
