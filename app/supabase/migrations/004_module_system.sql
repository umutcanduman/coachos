-- ============================================================
-- 004: Add-on module system
-- coach_modules, agreements, whatsapp_reminders
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- COACH_MODULES — tracks which modules each coach has enabled
-- ────────────────────────────────────────────────────────────
create table public.coach_modules (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.coaches(id) on delete cascade,
  module_key  text not null,
  is_enabled  boolean not null default true,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (coach_id, module_key)
);

create index idx_coach_modules_coach_id on public.coach_modules(coach_id);

alter table public.coach_modules enable row level security;

create policy "Coaches can view own modules"
  on public.coach_modules for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can insert own modules"
  on public.coach_modules for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can update own modules"
  on public.coach_modules for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can delete own modules"
  on public.coach_modules for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- ────────────────────────────────────────────────────────────
-- AGREEMENTS — coaching contracts / agreements per client
-- ────────────────────────────────────────────────────────────
create table public.agreements (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.coaches(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  title       text not null,
  content     text,
  key_terms   jsonb not null default '{}',
  status      text not null default 'draft' check (status in ('draft', 'active', 'expired')),
  signed_at   timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_agreements_coach_id on public.agreements(coach_id);
create index idx_agreements_client_id on public.agreements(client_id);

alter table public.agreements enable row level security;

create policy "Coaches can view own agreements"
  on public.agreements for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can insert own agreements"
  on public.agreements for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can update own agreements"
  on public.agreements for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can delete own agreements"
  on public.agreements for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- ────────────────────────────────────────────────────────────
-- WHATSAPP_REMINDERS — session reminders via WhatsApp
-- ────────────────────────────────────────────────────────────
create table public.whatsapp_reminders (
  id                uuid primary key default gen_random_uuid(),
  coach_id          uuid not null references public.coaches(id) on delete cascade,
  session_id        uuid not null references public.sessions(id) on delete cascade,
  client_id         uuid not null references public.clients(id) on delete cascade,
  scheduled_at      timestamptz not null,
  sent_at           timestamptz,
  status            text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  message_template  text,
  phone_number      text,
  created_at        timestamptz not null default now()
);

create index idx_whatsapp_reminders_coach_id on public.whatsapp_reminders(coach_id);
create index idx_whatsapp_reminders_session_id on public.whatsapp_reminders(session_id);

alter table public.whatsapp_reminders enable row level security;

create policy "Coaches can view own reminders"
  on public.whatsapp_reminders for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can insert own reminders"
  on public.whatsapp_reminders for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can update own reminders"
  on public.whatsapp_reminders for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can delete own reminders"
  on public.whatsapp_reminders for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));
