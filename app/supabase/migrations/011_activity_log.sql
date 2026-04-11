-- ============================================================
-- MIGRATION 011: Activity log for dashboard feed
-- ============================================================
-- Tracks stage transitions, client additions, and other events
-- that coaches want visibility into on their dashboard.
-- ============================================================

create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.coaches(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete cascade,
  action      text not null,        -- 'client_added', 'stage_changed', 'session_completed', etc.
  description text not null,        -- Human-readable: "John moved to Proposal"
  metadata    jsonb,                -- Optional structured data (from_stage, to_stage, etc.)
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_log_coach_id
  on public.activity_log(coach_id, created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "Coaches can view own activity" on public.activity_log;
create policy "Coaches can view own activity"
  on public.activity_log for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own activity" on public.activity_log;
create policy "Coaches can insert own activity"
  on public.activity_log for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- Backfill: create activity entries for existing clients.
-- This gives coaches an initial activity feed from day one.
insert into public.activity_log (coach_id, client_id, action, description, created_at)
select
  c.coach_id,
  c.id,
  'client_added',
  c.name || ' was added as a client',
  c.created_at
from public.clients c
on conflict do nothing;
