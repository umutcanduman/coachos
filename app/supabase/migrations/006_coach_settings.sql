-- ============================================================
-- 006: Coach settings / profile extensions
-- Adds columns to coaches table for settings page
-- ============================================================

-- Profile fields
alter table public.coaches
  add column if not exists phone       text,
  add column if not exists bio         text,
  add column if not exists timezone    text default 'Europe/Amsterdam',
  add column if not exists photo_url   text;

-- Practice fields
alter table public.coaches
  add column if not exists practice_name          text,
  add column if not exists website_url             text,
  add column if not exists default_session_duration integer default 60,
  add column if not exists default_session_type     text default 'one-on-one',
  add column if not exists currency                text default 'EUR';

-- Notification preferences
alter table public.coaches
  add column if not exists notify_session_reminders  boolean default true,
  add column if not exists notify_homework_completed boolean default true,
  add column if not exists notify_weekly_summary     boolean default true;

-- Admin notes (used by admin panel)
alter table public.coaches
  add column if not exists admin_notes text;

-- Updated timestamp
alter table public.coaches
  add column if not exists updated_at timestamptz default now();
