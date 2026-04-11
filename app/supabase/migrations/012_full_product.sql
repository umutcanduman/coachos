-- ============================================================
-- MIGRATION 012: Full product — tools, invoices, activity log
-- ============================================================

-- ----- clients: ensure lifecycle columns exist ----------------
-- Most already exist from 008/009; this is idempotent safety.
alter table public.clients
  add column if not exists discovery_call_notes text,
  add column if not exists coach_notes text;

-- ----- coach_settings -----------------------------------------
create table if not exists public.coach_settings (
  id                      uuid primary key default gen_random_uuid(),
  coach_id                uuid not null unique references public.coaches(id) on delete cascade,
  max_client_capacity     integer not null default 10,
  target_monthly_revenue  numeric(10,2),
  currency                text not null default 'EUR',
  timezone                text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.coach_settings enable row level security;

drop policy if exists "Coaches can view own settings" on public.coach_settings;
create policy "Coaches can view own settings"
  on public.coach_settings for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own settings" on public.coach_settings;
create policy "Coaches can insert own settings"
  on public.coach_settings for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can update own settings" on public.coach_settings;
create policy "Coaches can update own settings"
  on public.coach_settings for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- ----- leads_activity -----------------------------------------
create table if not exists public.leads_activity (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  coach_id        uuid not null references public.coaches(id) on delete cascade,
  activity_type   text not null check (activity_type in ('note','call','email','meeting','proposal','follow_up')),
  description     text not null,
  activity_date   date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists idx_leads_activity_coach
  on public.leads_activity(coach_id, created_at desc);
create index if not exists idx_leads_activity_client
  on public.leads_activity(client_id, created_at desc);

alter table public.leads_activity enable row level security;

drop policy if exists "Coaches can view own lead activities" on public.leads_activity;
create policy "Coaches can view own lead activities"
  on public.leads_activity for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own lead activities" on public.leads_activity;
create policy "Coaches can insert own lead activities"
  on public.leads_activity for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can delete own lead activities" on public.leads_activity;
create policy "Coaches can delete own lead activities"
  on public.leads_activity for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- ----- session_tools ------------------------------------------
create table if not exists public.session_tools (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  coach_id    uuid not null references public.coaches(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  tool_type   text not null check (tool_type in ('wheel_of_life','grow','smart_goal','values','checkin')),
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists idx_session_tools_coach
  on public.session_tools(coach_id, created_at desc);
create index if not exists idx_session_tools_client
  on public.session_tools(client_id, created_at desc);

alter table public.session_tools enable row level security;

drop policy if exists "Coaches can view own session tools" on public.session_tools;
create policy "Coaches can view own session tools"
  on public.session_tools for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own session tools" on public.session_tools;
create policy "Coaches can insert own session tools"
  on public.session_tools for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can update own session tools" on public.session_tools;
create policy "Coaches can update own session tools"
  on public.session_tools for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- ----- invoices -----------------------------------------------
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references public.coaches(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  payment_id      uuid references public.payments(id) on delete set null,
  invoice_number  text not null,
  amount          numeric(10,2) not null,
  issued_date     date not null default current_date,
  due_date        date,
  status          text not null default 'draft' check (status in ('draft','sent','paid')),
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_invoices_coach
  on public.invoices(coach_id, created_at desc);
create index if not exists idx_invoices_client
  on public.invoices(client_id);

alter table public.invoices enable row level security;

drop policy if exists "Coaches can view own invoices" on public.invoices;
create policy "Coaches can view own invoices"
  on public.invoices for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can insert own invoices" on public.invoices;
create policy "Coaches can insert own invoices"
  on public.invoices for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

drop policy if exists "Coaches can update own invoices" on public.invoices;
create policy "Coaches can update own invoices"
  on public.invoices for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- Auto-generate invoice numbers via a sequence
create sequence if not exists public.invoice_number_seq start 1;

-- Helper function for generating invoice numbers
create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
begin
  return 'INV-' || extract(year from current_date)::text || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0');
end;
$$;

-- Add prep_notes and rating to sessions for pre/post session flow
alter table public.sessions
  add column if not exists prep_notes text,
  add column if not exists rating integer check (rating is null or (rating >= 1 and rating <= 5));
