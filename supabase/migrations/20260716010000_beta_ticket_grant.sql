-- ---------------------------------------------------------------------------
-- Beta: grant a small starting ticket stash (launch blocker A3)
--
-- Decision (PO, 2026-07): beta keeps the "1 free send/day" scarcity but does
-- NOT wire real IAP yet. Without a supply path, ticket_balance stays 0 forever
-- and the 2nd+ daily send is impossible for everyone. For beta we simply grant
-- a small stash so the extra-send / ticket-spend UX is exercisable and
-- observable. Real IAP (top-up) is deferred to pre-production.
--
-- Effect: new profiles start at 5 tickets; existing beta users with 0 are
-- topped up to 5 (safe in beta — with no IAP, 0 only ever means "never had
-- any"). The daily-1-free rule and per-send ticket decrement are unchanged.
--
-- Acceptance criteria (assertable):
--  1. profiles.ticket_balance DEFAULT is 5.
--  2. after this migration, no active profile has ticket_balance < 5 unless it
--     was already >5 (backfill only raises 0 -> 5).
--  3. a woman can send 1 free + up to 5 ticketed missions/day.
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ALTER COLUMN ticket_balance SET DEFAULT 5;

-- One-time beta backfill: give already-registered users the same starting stash.
UPDATE public.profiles
SET ticket_balance = 5
WHERE ticket_balance = 0;
