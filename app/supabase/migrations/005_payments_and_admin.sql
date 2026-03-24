-- ============================================================
-- 005: Payment system + admin panel
-- Extends coach_modules with payment fields,
-- adds module_payments and admin_users tables
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Extend COACH_MODULES with payment & activation tracking
-- ────────────────────────────────────────────────────────────
alter table public.coach_modules
  add column if not exists payment_status  text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  add column if not exists payment_amount  numeric(10,2),
  add column if not exists payment_date    timestamptz,
  add column if not exists payment_reference text,
  add column if not exists activated_at    timestamptz,
  add column if not exists deactivated_at  timestamptz,
  add column if not exists activated_by    uuid references auth.users(id);

-- ────────────────────────────────────────────────────────────
-- MODULE_PAYMENTS — payment history per module activation
-- ────────────────────────────────────────────────────────────
create table public.module_payments (
  id                      uuid primary key default gen_random_uuid(),
  coach_id                uuid not null references public.coaches(id) on delete cascade,
  module_key              text not null,
  amount                  numeric(10,2) not null,
  stripe_payment_intent_id text,
  stripe_session_id       text,
  status                  text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at              timestamptz not null default now()
);

create index idx_module_payments_coach_id on public.module_payments(coach_id);
create index idx_module_payments_status on public.module_payments(status);

alter table public.module_payments enable row level security;

create policy "Coaches can view own payments"
  on public.module_payments for select
  using (coach_id in (select id from public.coaches where user_id = auth.uid()));

create policy "Service role can insert payments"
  on public.module_payments for insert
  with check (true);

create policy "Service role can update payments"
  on public.module_payments for update
  using (true);

-- ────────────────────────────────────────────────────────────
-- ADMIN_USERS — tracks which auth users have admin access
-- ────────────────────────────────────────────────────────────
create table public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Only admin users can read the admin_users table
create policy "Admin users can read admin table"
  on public.admin_users for select
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Admin RLS bypass policies for coach_modules and module_payments
-- Admin users need to see ALL coaches' modules and payments
-- ────────────────────────────────────────────────────────────
create policy "Admins can view all coach modules"
  on public.coach_modules for select
  using (
    exists (select 1 from public.admin_users where user_id = auth.uid())
  );

create policy "Admins can update all coach modules"
  on public.coach_modules for update
  using (
    exists (select 1 from public.admin_users where user_id = auth.uid())
  );

create policy "Admins can insert coach modules"
  on public.coach_modules for insert
  with check (
    exists (select 1 from public.admin_users where user_id = auth.uid())
  );

create policy "Admins can view all module payments"
  on public.module_payments for select
  using (
    exists (select 1 from public.admin_users where user_id = auth.uid())
  );

-- Admin policies for coaches table (admins need to see all coaches)
create policy "Admins can view all coaches"
  on public.coaches for select
  using (
    exists (select 1 from public.admin_users where user_id = auth.uid())
  );
