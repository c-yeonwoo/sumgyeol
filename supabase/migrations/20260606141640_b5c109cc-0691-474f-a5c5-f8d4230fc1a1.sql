
-- 1) Restrict nudges UPDATE: receiver may only change status/responded_at
CREATE OR REPLACE FUNCTION public.enforce_nudges_receiver_update_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.question_id IS DISTINCT FROM OLD.question_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION '이 항목은 변경할 수 없어요.';
  END IF;
  IF NEW.status NOT IN ('pending', 'answered', 'dismissed') THEN
    RAISE EXCEPTION '잘못된 상태값이에요.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nudges_receiver_update_columns ON public.nudges;
CREATE TRIGGER trg_nudges_receiver_update_columns
BEFORE UPDATE ON public.nudges
FOR EACH ROW EXECUTE FUNCTION public.enforce_nudges_receiver_update_columns();

-- 2) Rate-limit persona_reads inserts (max 10 per hour per user)
CREATE OR REPLACE FUNCTION public.enforce_persona_reads_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c
    FROM public.persona_reads
    WHERE user_id = NEW.user_id
      AND generated_at > now() - interval '1 hour';
  IF c >= 10 THEN
    RAISE EXCEPTION '잠시 후 다시 시도해 주세요.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_persona_reads_rate_limit ON public.persona_reads;
CREATE TRIGGER trg_persona_reads_rate_limit
BEFORE INSERT ON public.persona_reads
FOR EACH ROW EXECUTE FUNCTION public.enforce_persona_reads_rate_limit();
