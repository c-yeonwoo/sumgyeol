-- ---------------------------------------------------------------------------
-- Fix: verdict forgery / unilateral unlock (launch blocker A1)
--
-- Before: mission_deliveries had a table-wide UPDATE grant + a permissive RLS
-- policy ("participants update deliveries") with USING (sender OR receiver) and
-- NO WITH CHECK. A sender could UPDATE receiver_verdict='ok' (or vice versa),
-- satisfy the mission_try_unlock trigger's "both ok" branch, and force-unlock
-- the other party's profile + open a chat thread. This defeats the mutual-OK
-- premise and violates the peer's privacy.
--
-- After: verdicts can only be set through set_delivery_verdict(), a
-- SECURITY DEFINER RPC that writes ONLY the caller's own verdict column.
-- Direct client UPDATE on mission_deliveries is revoked entirely (accept /
-- reply / deliver / resend already go through SECURITY DEFINER RPCs, so nothing
-- else depends on the authenticated UPDATE grant).
--
-- Acceptance criteria (assertable):
--  1. sender setting receiver_verdict (or receiver setting sender_verdict)
--     is impossible — there is no code path to do so.
--  2. a participant can set only their own column, pending -> ok|pass.
--  3. both 'ok' still unlocks via the existing trg_mission_try_unlock trigger.
--  4. authenticated has NO direct UPDATE privilege on mission_deliveries.
--  5. a non-participant call raises 'not a participant'.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_delivery_verdict(
  p_delivery_id bigint,
  p_verdict text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.mission_deliveries;
  v_col text;
  v_current text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_verdict NOT IN ('ok', 'pass') THEN
    RAISE EXCEPTION 'invalid verdict';
  END IF;

  SELECT * INTO v_row
  FROM public.mission_deliveries
  WHERE id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'delivery not found';
  END IF;

  -- Resolve caller's own column only. A participant can never touch the peer's.
  IF v_uid = v_row.sender_id THEN
    v_col := 'sender_verdict';
    v_current := v_row.sender_verdict;
  ELSIF v_uid = v_row.receiver_id THEN
    v_col := 'receiver_verdict';
    v_current := v_row.receiver_verdict;
  ELSE
    RAISE EXCEPTION 'not a participant';
  END IF;

  IF v_current <> 'pending' THEN
    RAISE EXCEPTION 'verdict already set';
  END IF;

  -- Update only the caller's own column; trg_mission_try_unlock handles unlock.
  IF v_col = 'sender_verdict' THEN
    UPDATE public.mission_deliveries
      SET sender_verdict = p_verdict
      WHERE id = p_delivery_id;
  ELSE
    UPDATE public.mission_deliveries
      SET receiver_verdict = p_verdict
      WHERE id = p_delivery_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_delivery_verdict(bigint, text) TO authenticated;

-- Close the direct-UPDATE hole: no client may UPDATE mission_deliveries rows.
-- All mutations flow through SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "participants update deliveries" ON public.mission_deliveries;
REVOKE UPDATE ON public.mission_deliveries FROM authenticated;
