-- ============================================================
-- MIGRATION 009: Lead next-follow-up reminder
-- ============================================================
-- Adds the next_follow_up_date column referenced from the lead
-- panel in the CRM. Idempotent — safe to re-run.
-- ============================================================

alter table public.clients
  add column if not exists next_follow_up_date date;

create index if not exists idx_clients_next_follow_up_date
  on public.clients(coach_id, next_follow_up_date)
  where next_follow_up_date is not null;
