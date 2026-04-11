-- ============================================================
-- MIGRATION 010: Lean lifecycle — 5 stages only
-- ============================================================
-- Removes onboarding, completing, offboarding from lifecycle.
-- Moves any clients in those stages to the nearest valid stage.
-- Does NOT drop the onboarding/offboarding_checklists tables
-- (the data is preserved in case we re-enable later).
-- ============================================================

-- 1. Backfill removed stages into valid ones
update public.clients
   set lifecycle_stage = 'active'
 where lifecycle_stage in ('onboarding', 'completing', 'offboarding');

-- 2. Drop the old check constraint and replace it with the lean set.
--    The constraint name depends on the Postgres auto-naming from migration 008.
--    We drop all matching constraints on lifecycle_stage to be safe.
do $$
declare
  r record;
begin
  for r in
    select conname
      from pg_constraint
     where conrelid = 'public.clients'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%lifecycle_stage%'
  loop
    execute format('alter table public.clients drop constraint %I', r.conname);
  end loop;
end;
$$;

alter table public.clients
  add constraint clients_lifecycle_stage_check
  check (lifecycle_stage in ('lead','discovery','proposal','active','alumni'));
