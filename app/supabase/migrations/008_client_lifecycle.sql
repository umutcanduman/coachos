-- ============================================================
-- MIGRATION 008: Client Lifecycle System
-- ============================================================
-- Adds lifecycle stage tracking, lead/proposal/onboarding/offboarding
-- fields to clients, plus dedicated checklists tables.
-- ============================================================

-- ----- clients: lifecycle columns -----------------------------
alter table public.clients
  add column if not exists lifecycle_stage     text not null default 'active'
    check (lifecycle_stage in (
      'lead','discovery','proposal','onboarding',
      'active','completing','offboarding','alumni'
    )),
  add column if not exists source              text
    check (source is null or source in (
      'referral','website','linkedin','instagram','event','other'
    )),
  add column if not exists source_detail       text,
  add column if not exists lead_date           date,
  add column if not exists discovery_call_date date,
  add column if not exists discovery_call_outcome text
    check (discovery_call_outcome is null or discovery_call_outcome in (
      'converted','not_ready','not_a_fit'
    )),
  add column if not exists proposal_sent_date  date,
  add column if not exists proposal_package    text,
  add column if not exists proposal_price      numeric(10,2),
  add column if not exists proposal_status     text
    check (proposal_status is null or proposal_status in (
      'sent','accepted','declined','negotiating'
    )),
  add column if not exists onboarding_completed_at  timestamptz,
  add column if not exists offboarding_completed_at timestamptz,
  add column if not exists alumni_since        date,
  add column if not exists reengagement_date   date,
  add column if not exists exit_reason         text,
  add column if not exists coach_notes         text,
  add column if not exists lifecycle_stage_updated_at timestamptz not null default now();

create index if not exists idx_clients_lifecycle_stage
  on public.clients(coach_id, lifecycle_stage);

-- Backfill: any existing client whose status is 'active' becomes 'active'
update public.clients
   set lifecycle_stage = 'active'
 where status = 'active';

-- The status check constraint in 001 only allows ('active','inactive','archived'),
-- but to be safe (and forward-compatible) handle a 'completed' status if any
-- environment has it.
update public.clients
   set lifecycle_stage = 'alumni',
       alumni_since = current_date
 where lifecycle_stage = 'active' and status = 'archived';

-- Trigger to keep lifecycle_stage_updated_at fresh whenever stage changes.
create or replace function public.touch_lifecycle_stage()
returns trigger
language plpgsql
as $$
begin
  if new.lifecycle_stage is distinct from old.lifecycle_stage then
    new.lifecycle_stage_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_touch_lifecycle_stage on public.clients;
create trigger trg_touch_lifecycle_stage
  before update on public.clients
  for each row
  execute function public.touch_lifecycle_stage();


-- ----- onboarding_checklists ----------------------------------
create table if not exists public.onboarding_checklists (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid not null unique references public.clients(id) on delete cascade,
  coach_id                    uuid not null references public.coaches(id) on delete cascade,
  welcome_email_sent          boolean not null default false,
  agreement_sent              boolean not null default false,
  goals_set                   boolean not null default false,
  first_session_scheduled     boolean not null default false,
  intake_homework_assigned    boolean not null default false,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_onboarding_checklists_coach_id
  on public.onboarding_checklists(coach_id);

alter table public.onboarding_checklists enable row level security;

drop policy if exists "Coaches can view own onboarding checklists" on public.onboarding_checklists;
create policy "Coaches can view own onboarding checklists"
  on public.onboarding_checklists for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own onboarding checklists" on public.onboarding_checklists;
create policy "Coaches can insert own onboarding checklists"
  on public.onboarding_checklists for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can update own onboarding checklists" on public.onboarding_checklists;
create policy "Coaches can update own onboarding checklists"
  on public.onboarding_checklists for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can delete own onboarding checklists" on public.onboarding_checklists;
create policy "Coaches can delete own onboarding checklists"
  on public.onboarding_checklists for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));


-- ----- offboarding_checklists ---------------------------------
create table if not exists public.offboarding_checklists (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid not null unique references public.clients(id) on delete cascade,
  coach_id                    uuid not null references public.coaches(id) on delete cascade,
  results_summary_written     boolean not null default false,
  testimonial_requested       boolean not null default false,
  referral_asked              boolean not null default false,
  alumni_status_set           boolean not null default false,
  farewell_sent               boolean not null default false,
  results_summary             text,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_offboarding_checklists_coach_id
  on public.offboarding_checklists(coach_id);

alter table public.offboarding_checklists enable row level security;

drop policy if exists "Coaches can view own offboarding checklists" on public.offboarding_checklists;
create policy "Coaches can view own offboarding checklists"
  on public.offboarding_checklists for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own offboarding checklists" on public.offboarding_checklists;
create policy "Coaches can insert own offboarding checklists"
  on public.offboarding_checklists for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can update own offboarding checklists" on public.offboarding_checklists;
create policy "Coaches can update own offboarding checklists"
  on public.offboarding_checklists for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can delete own offboarding checklists" on public.offboarding_checklists;
create policy "Coaches can delete own offboarding checklists"
  on public.offboarding_checklists for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));
