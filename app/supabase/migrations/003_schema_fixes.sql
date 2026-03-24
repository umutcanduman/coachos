-- ============================================================
-- 003: Fix schema gaps between migration 001 and application code
-- ============================================================

-- 1. Clients: allow 'follow-up' and 'completed' statuses
alter table public.clients drop constraint if exists clients_status_check;
alter table public.clients add constraint clients_status_check
  check (status in ('active', 'inactive', 'archived', 'follow-up', 'completed'));

-- 2. Referrals: add denormalised name/email columns + coach_id
--    The dashboard queries these directly for performance.
alter table public.referrals add column if not exists coach_id         uuid references public.coaches(id) on delete cascade;
alter table public.referrals add column if not exists referrer_name    text;
alter table public.referrals add column if not exists referrer_email   text;
alter table public.referrals add column if not exists referred_name    text;
alter table public.referrals add column if not exists referred_email   text;

create index if not exists idx_referrals_coach_id on public.referrals(coach_id);

-- Update RLS policy for referrals to also allow coach_id-based access
drop policy if exists "Coaches can view own referrals" on public.referrals;
create policy "Coaches can view own referrals"
  on public.referrals for select
  using (
    coach_id in (select id from public.coaches where user_id = auth.uid())
    or referrer_id in (
      select id from public.clients
      where coach_id in (select id from public.coaches where user_id = auth.uid())
    )
  );

-- 3. Goals table (referenced by progress + client profile pages)
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  title       text not null,
  progress    integer not null default 0 check (progress >= 0 and progress <= 100),
  status      text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_goals_client_id on public.goals(client_id);

alter table public.goals enable row level security;

create policy "Coaches can view own goals"
  on public.goals for select
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can insert own goals"
  on public.goals for insert
  with check (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can update own goals"
  on public.goals for update
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can delete own goals"
  on public.goals for delete
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));
