-- CoachOS Initial Schema
-- All tables use UUID primary keys and reference auth.users for coach identity.

-- Uses gen_random_uuid() which is built into Postgres 14+

-- ============================================================
-- COACHES
-- ============================================================
create table public.coaches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references public.coaches(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  location      text,
  package_type  text,
  status        text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  referred_by   uuid references public.clients(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- SESSIONS
-- ============================================================
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  coach_id    uuid not null references public.coaches(id) on delete cascade,
  date        timestamptz not null,
  duration    integer not null default 60, -- minutes
  type        text not null default 'one-on-one' check (type in ('one-on-one', 'group', 'discovery', 'follow-up')),
  status      text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- HOMEWORK
-- ============================================================
create table public.homework (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  title       text not null,
  description text,
  due_date    date,
  status      text not null default 'pending' check (status in ('pending', 'in-progress', 'completed', 'overdue')),
  category    text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PACKAGES
-- ============================================================
create table public.packages (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  total_sessions  integer not null,
  used_sessions   integer not null default 0,
  price           numeric(10,2) not null,
  paid_amount     numeric(10,2) not null default 0,
  status          text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  start_date      date not null,
  end_date        date,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  coach_id    uuid not null references public.coaches(id) on delete cascade,
  amount      numeric(10,2) not null,
  status      text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'refunded')),
  due_date    date,
  paid_date   date,
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- REFERRALS
-- ============================================================
create table public.referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_id         uuid not null references public.clients(id) on delete cascade,
  referred_client_id  uuid not null references public.clients(id) on delete cascade,
  status              text not null default 'pending' check (status in ('pending', 'converted', 'expired')),
  gift_status         text not null default 'none' check (gift_status in ('none', 'pending', 'sent', 'delivered')),
  created_at          timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.coaches enable row level security;
alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.homework enable row level security;
alter table public.packages enable row level security;
alter table public.payments enable row level security;
alter table public.referrals enable row level security;

-- Coaches can only access their own row
create policy "Coaches can view own profile"
  on public.coaches for select
  using (user_id = auth.uid());

create policy "Coaches can update own profile"
  on public.coaches for update
  using (user_id = auth.uid());

-- Clients: coach can only see their own clients
create policy "Coaches can view own clients"
  on public.clients for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can insert own clients"
  on public.clients for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can update own clients"
  on public.clients for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can delete own clients"
  on public.clients for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- Sessions: coach can only see their own sessions
create policy "Coaches can view own sessions"
  on public.sessions for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can insert own sessions"
  on public.sessions for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can update own sessions"
  on public.sessions for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can delete own sessions"
  on public.sessions for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- Homework: through client ownership
create policy "Coaches can view own homework"
  on public.homework for select
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can insert own homework"
  on public.homework for insert
  with check (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can update own homework"
  on public.homework for update
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can delete own homework"
  on public.homework for delete
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

-- Packages: through client ownership
create policy "Coaches can view own packages"
  on public.packages for select
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can insert own packages"
  on public.packages for insert
  with check (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can update own packages"
  on public.packages for update
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can delete own packages"
  on public.packages for delete
  using (client_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

-- Payments: coach can only see their own
create policy "Coaches can view own payments"
  on public.payments for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can insert own payments"
  on public.payments for insert
  with check (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can update own payments"
  on public.payments for update
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Coaches can delete own payments"
  on public.payments for delete
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

-- Referrals: through client ownership (referrer must belong to coach)
create policy "Coaches can view own referrals"
  on public.referrals for select
  using (referrer_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can insert own referrals"
  on public.referrals for insert
  with check (referrer_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can update own referrals"
  on public.referrals for update
  using (referrer_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

create policy "Coaches can delete own referrals"
  on public.referrals for delete
  using (referrer_id in (
    select id from public.clients
    where coach_id in (select id from public.coaches where user_id = auth.uid())
  ));

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_clients_coach_id on public.clients(coach_id);
create index idx_sessions_coach_id on public.sessions(coach_id);
create index idx_sessions_client_id on public.sessions(client_id);
create index idx_sessions_date on public.sessions(date);
create index idx_homework_client_id on public.homework(client_id);
create index idx_packages_client_id on public.packages(client_id);
create index idx_payments_coach_id on public.payments(coach_id);
create index idx_payments_client_id on public.payments(client_id);
create index idx_referrals_referrer_id on public.referrals(referrer_id);
