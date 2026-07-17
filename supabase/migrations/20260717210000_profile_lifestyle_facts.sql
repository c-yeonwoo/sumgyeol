-- Lifestyle facts (drink/tattoo) + smoke without 비공개; lock birth_year after onboard.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS drink text,
  ADD COLUMN IF NOT EXISTS tattoo text;

UPDATE public.profiles SET smoke = '안 함' WHERE smoke = '비공개';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_smoke_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_smoke_check
  CHECK (smoke IS NULL OR smoke IN ('안 함', '가끔', '함'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_drink_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_drink_check
      CHECK (drink IS NULL OR drink IN ('안 마심', '가끔', '자주'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tattoo_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tattoo_check
      CHECK (tattoo IS NULL OR tattoo IN ('없어요', '있어요'));
  END IF;
END $$;

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (
  display_name,
  handle,
  bio,
  avatar_url,
  birth_year,
  region,
  height_cm,
  gender,
  photos,
  intro_answers,
  ai_intro,
  ai_tags,
  ai_ideal_line,
  job_chip,
  smoke,
  drink,
  tattoo,
  onboarded
) ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_profiles_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.onboarded IS TRUE THEN
    IF NEW.onboarded IS DISTINCT FROM OLD.onboarded THEN
      RAISE EXCEPTION 'onboarded locked';
    END IF;
    IF NEW.gender IS DISTINCT FROM OLD.gender THEN
      RAISE EXCEPTION 'gender locked';
    END IF;
    IF NEW.birth_year IS DISTINCT FROM OLD.birth_year THEN
      RAISE EXCEPTION 'birth_year locked';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
