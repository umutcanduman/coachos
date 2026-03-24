-- ============================================================
-- CoachOS Seed Data
-- ============================================================
-- Run this AFTER all migrations (001, 002, 003).
--
-- HOW TO RUN:
--   1. Open your Supabase project dashboard
--   2. Go to SQL Editor (left sidebar)
--   3. Click "+ New Query"
--   4. Paste this entire file
--   5. Click "Run" (or Cmd+Enter)
--
-- This script is idempotent — it clears existing seed data
-- before inserting, so it's safe to run multiple times.
-- ============================================================

-- Use a transaction so everything succeeds or nothing does
begin;

-- ────────────────────────────────────────────────────────────
-- 0. Resolve the coach's auth user id
-- ────────────────────────────────────────────────────────────
-- Grab the first (and likely only) user from auth.users.
-- If you have multiple users, replace this with your specific user id.

do $$
declare
  v_auth_uid    uuid;
  v_coach_id    uuid;

  -- Client IDs (fixed so we can reference them later)
  v_laura       uuid := gen_random_uuid();
  v_james       uuid := gen_random_uuid();
  v_amara       uuid := gen_random_uuid();
  v_sophie      uuid := gen_random_uuid();
  v_tom         uuid := gen_random_uuid();

  -- Session IDs (need some for homework FK)
  v_sess_1      uuid := gen_random_uuid();
  v_sess_2      uuid := gen_random_uuid();
  v_sess_3      uuid := gen_random_uuid();
  v_sess_4      uuid := gen_random_uuid();
  v_sess_5      uuid := gen_random_uuid();
  v_sess_6      uuid := gen_random_uuid();
  v_sess_7      uuid := gen_random_uuid();
  v_sess_8      uuid := gen_random_uuid();
  v_sess_9      uuid := gen_random_uuid();
  v_sess_10     uuid := gen_random_uuid();
  v_sess_11     uuid := gen_random_uuid();
  v_sess_12     uuid := gen_random_uuid();
  v_sess_13     uuid := gen_random_uuid();
  v_sess_14     uuid := gen_random_uuid();
  v_sess_15     uuid := gen_random_uuid();

begin
  -- Get the auth user id
  select id into v_auth_uid from auth.users order by created_at asc limit 1;

  if v_auth_uid is null then
    raise exception 'No auth user found. Sign up first, then run this seed.';
  end if;

  raise notice 'Using auth user: %', v_auth_uid;

  -- ──────────────────────────────────────────────────────────
  -- 1. COACH
  -- ──────────────────────────────────────────────────────────
  -- Upsert so re-running is safe
  insert into public.coaches (user_id, email, name)
  values (
    v_auth_uid,
    (select email from auth.users where id = v_auth_uid),
    coalesce(
      (select raw_user_meta_data->>'name' from auth.users where id = v_auth_uid),
      'Sarah Brennan'
    )
  )
  on conflict (user_id) do update set
    name = excluded.name
  returning id into v_coach_id;

  raise notice 'Coach ID: %', v_coach_id;

  -- ──────────────────────────────────────────────────────────
  -- Clean up any existing seed data for this coach
  -- ──────────────────────────────────────────────────────────
  delete from public.referrals where coach_id = v_coach_id;
  delete from public.goals     where client_id in (select id from public.clients where coach_id = v_coach_id);
  delete from public.homework  where client_id in (select id from public.clients where coach_id = v_coach_id);
  delete from public.payments  where coach_id = v_coach_id;
  delete from public.sessions  where coach_id = v_coach_id;
  delete from public.packages  where client_id in (select id from public.clients where coach_id = v_coach_id);
  delete from public.clients   where coach_id = v_coach_id;

  -- ──────────────────────────────────────────────────────────
  -- 2. CLIENTS (5)
  -- ──────────────────────────────────────────────────────────
  insert into public.clients (id, coach_id, name, email, phone, location, package_type, status, created_at) values
    (v_laura,  v_coach_id, 'Laura Martínez',  'laura@martinez.coach',   '+31 6 1234 5678', 'Rotterdam',  'Growth Journey',       'active',    '2026-01-10T09:00:00Z'),
    (v_james,  v_coach_id, 'James Keane',     'james@keane.ie',         '+353 87 123 4567','Dublin',     'Deep Transformation',  'active',    '2025-11-20T10:00:00Z'),
    (v_amara,  v_coach_id, 'Amara Osei',      'amara@osei.nl',          '+31 6 9876 5432', 'Amsterdam',  'Clarity Session',      'active',    '2026-03-05T14:00:00Z'),
    (v_sophie, v_coach_id, 'Sophie Renard',   'sophie@renard.be',       '+32 470 12 34 56','Brussels',   'Growth Journey',       'follow-up', '2026-02-01T11:00:00Z'),
    (v_tom,    v_coach_id, 'Tom Dijk',        'tom@dijk.nl',            '+31 6 5555 1234', 'Amsterdam',  'Clarity Session',      'completed', '2025-12-15T08:00:00Z');

  -- Set Laura as referred by James
  update public.clients set referred_by = v_james where id = v_laura;

  -- ──────────────────────────────────────────────────────────
  -- 3. PACKAGES (one per client)
  -- ──────────────────────────────────────────────────────────
  insert into public.packages (client_id, total_sessions, used_sessions, price, paid_amount, status, start_date, end_date) values
    -- Laura: Growth Journey 6-session, 4 done, fully paid
    (v_laura,  6,  4, 1440.00, 1440.00, 'active',    '2026-01-15', '2026-04-15'),
    -- James: Deep Transformation 12-session, 7 done, fully paid
    (v_james,  12, 7, 3200.00, 3200.00, 'active',    '2025-12-01', '2026-05-31'),
    -- Amara: Clarity single session, 0 done, paid
    (v_amara,  1,  0, 180.00,  180.00,  'active',    '2026-03-10', null),
    -- Sophie: Growth Journey 6-session, 1 done, half paid
    (v_sophie, 6,  1, 1440.00, 720.00,  'active',    '2026-02-10', '2026-05-10'),
    -- Tom: Clarity single session, completed, UNPAID (overdue)
    (v_tom,    1,  1, 180.00,  0.00,    'completed', '2025-12-20', '2026-01-20');

  -- ──────────────────────────────────────────────────────────
  -- 4. SESSIONS (15 total)
  -- ──────────────────────────────────────────────────────────
  insert into public.sessions (id, client_id, coach_id, date, duration, type, status, notes) values
    -- Laura: 4 completed, 1 scheduled
    (v_sess_1,  v_laura, v_coach_id, '2026-01-22 10:00:00+01', 60, 'one-on-one', 'completed',
     'Explored career values. Laura identified three core themes: autonomy, creativity, impact. Strong clarity on what she does NOT want.'),
    (v_sess_2,  v_laura, v_coach_id, '2026-02-05 10:00:00+01', 60, 'one-on-one', 'completed',
     'Worked through limiting beliefs around "not being qualified enough". Introduced reframing exercise. Homework: write 3 counter-examples per belief.'),
    (v_sess_3,  v_laura, v_coach_id, '2026-02-19 10:00:00+01', 60, 'one-on-one', 'completed',
     'Reviewed counter-examples — excellent work. Started building her personal narrative for interviews. Energy was high today.'),
    (v_sess_4,  v_laura, v_coach_id, '2026-03-07 10:00:00+01', 60, 'one-on-one', 'completed',
     'Mock interview practice. Laura was nervous at first but found her stride. Discussed salary negotiation principles.'),
    (v_sess_5,  v_laura, v_coach_id, '2026-03-28 10:00:00+01', 60, 'one-on-one', 'scheduled', null),

    -- James: 7 completed, 1 scheduled
    (v_sess_6,  v_james, v_coach_id, '2025-12-10 14:00:00+00', 60, 'one-on-one', 'completed',
     'Discovery session. James wants to transition from senior IC to director-level leadership. Main blockers: delegation and executive presence.'),
    (v_sess_7,  v_james, v_coach_id, '2025-12-24 14:00:00+00', 60, 'one-on-one', 'completed',
     'Explored delegation patterns. James tends to rescue failing projects instead of coaching his reports through them.'),
    (v_sess_8,  v_james, v_coach_id, '2026-01-14 14:00:00+00', 60, 'one-on-one', 'completed',
     'Accountability check-in. James delegated two projects last week — both went well. Discussed the emotional discomfort of "letting go".'),
    (v_sess_9,  v_james, v_coach_id, '2026-01-28 14:00:00+00', 60, 'one-on-one', 'completed',
     'Presentation skills deep-dive. Recorded a practice exec summary and reviewed together. Good structure, needs more pausing.'),
    (v_sess_10, v_james, v_coach_id, '2026-02-11 14:00:00+00', 60, 'one-on-one', 'completed',
     'James gave his first all-hands presentation — got positive feedback from VP. We debriefed what worked and what to refine.'),
    (v_sess_11, v_james, v_coach_id, '2026-02-25 14:00:00+00', 60, 'one-on-one', 'completed',
     'Stakeholder mapping exercise. Identified three key relationships James needs to invest in over the next quarter.'),
    (v_sess_12, v_james, v_coach_id, '2026-03-08 14:00:00+00', 60, 'one-on-one', 'completed',
     'Mid-programme review. James is visibly more confident. His manager gave him an "exceeds expectations" in the latest review cycle.'),
    (v_sess_13, v_james, v_coach_id, '2026-03-29 14:00:00+00', 60, 'one-on-one', 'scheduled', null),

    -- Amara: 0 completed, 1 scheduled (upcoming Clarity session)
    (v_sess_14, v_amara, v_coach_id, '2026-03-26 11:00:00+01', 90, 'discovery',  'scheduled', null),

    -- Sophie: 1 completed
    (v_sess_15, v_sophie, v_coach_id, '2026-02-14 15:00:00+01', 60, 'one-on-one', 'completed',
     'First session. Sophie is navigating a difficult period after a restructuring at work. We established the coaching agreement and identified three focus areas.');

  -- Tom: his 1 session is already counted in packages (used_sessions=1) but
  -- we don't need to insert it — his package is completed and he's in follow-up status.

  -- ──────────────────────────────────────────────────────────
  -- 5. HOMEWORK (10 items)
  -- ──────────────────────────────────────────────────────────
  insert into public.homework (client_id, session_id, title, description, due_date, status, category) values
    -- Laura's homework
    (v_laura, v_sess_1, 'Values mapping exercise',
     'Complete the career values worksheet. Rank your top 10 values and write a paragraph on each of the top 3.',
     '2026-02-03', 'completed', 'Self-awareness'),
    (v_laura, v_sess_2, 'Counter-examples journal',
     'Write 3 counter-examples for each limiting belief we identified. Use the STAR format.',
     '2026-02-17', 'completed', 'Mindset'),
    (v_laura, v_sess_3, 'Personal narrative draft',
     'Draft your 2-minute career narrative. Practice delivering it out loud 3 times.',
     '2026-03-05', 'completed', 'Communication'),
    (v_laura, v_sess_4, 'Salary research',
     'Research market rates for your target role in 3 cities. Prepare your negotiation range.',
     '2026-03-26', 'pending', 'Career planning'),

    -- James's homework
    (v_james, v_sess_6, 'Leadership style self-assessment',
     'Complete the leadership inventory questionnaire and write a 1-page reflection.',
     '2025-12-22', 'completed', 'Leadership'),
    (v_james, v_sess_7, 'Delegation tracker',
     'Track every delegation decision this week. Note what you delegated, to whom, and how it felt.',
     '2026-01-12', 'completed', 'Leadership'),
    (v_james, v_sess_9, 'Record practice presentation',
     'Record a 5-minute exec summary and review it yourself before our next session.',
     '2026-02-09', 'completed', 'Communication'),
    (v_james, v_sess_11, 'Stakeholder meeting schedule',
     'Set up coffee chats with the 3 key stakeholders we identified. Complete at least 1 before next session.',
     '2026-03-06', 'in-progress', 'Networking'),

    -- Sophie's homework
    (v_sophie, v_sess_15, 'Journaling: what I want to preserve',
     'Write freely for 20 minutes about what aspects of your work life you want to protect through this transition.',
     '2026-02-28', 'overdue', 'Self-awareness'),
    (v_sophie, v_sess_15, 'Boundary mapping',
     'List 3 boundaries you want to set at work. For each, write the exact words you would use.',
     '2026-03-10', 'pending', 'Wellbeing');

  -- ──────────────────────────────────────────────────────────
  -- 6. PAYMENTS (6)
  -- ──────────────────────────────────────────────────────────
  insert into public.payments (client_id, coach_id, amount, status, due_date, paid_date, description) values
    -- Laura: fully paid upfront
    (v_laura, v_coach_id, 1440.00, 'paid',    '2026-01-15', '2026-01-14', 'Growth Journey — full package'),

    -- James: fully paid
    (v_james, v_coach_id, 3200.00, 'paid',    '2025-12-01', '2025-11-28', 'Deep Transformation — full package'),

    -- Amara: paid for single session
    (v_amara, v_coach_id, 180.00,  'paid',    '2026-03-10', '2026-03-08', 'Clarity Session — single'),

    -- Sophie: paid instalment 1, instalment 2 is due
    (v_sophie, v_coach_id, 720.00, 'paid',    '2026-02-10', '2026-02-10', 'Growth Journey — instalment 1 of 2'),
    (v_sophie, v_coach_id, 720.00, 'pending', '2026-04-01', null,         'Growth Journey — instalment 2 of 2'),

    -- Tom: overdue — session completed but never paid
    (v_tom, v_coach_id, 180.00,    'overdue', '2026-01-20', null,         'Clarity Session — overdue');

  -- ──────────────────────────────────────────────────────────
  -- 7. REFERRALS (3)
  -- ──────────────────────────────────────────────────────────
  insert into public.referrals (
    referrer_id, referred_client_id, coach_id,
    referrer_name, referrer_email, referred_name, referred_email,
    status, gift_status, created_at
  ) values
    -- James referred Laura (converted — Laura is a paying client)
    (v_james, v_laura, v_coach_id,
     'James Keane', 'james@keane.ie', 'Laura Martínez', 'laura@martinez.coach',
     'converted', 'sent', '2026-01-08T12:00:00Z'),

    -- Laura referred Amara (converted)
    (v_laura, v_amara, v_coach_id,
     'Laura Martínez', 'laura@martinez.coach', 'Amara Osei', 'amara@osei.nl',
     'converted', 'pending', '2026-03-02T09:30:00Z'),

    -- Laura referred someone who hasn't signed up yet (pending)
    (v_laura, v_sophie, v_coach_id,
     'Laura Martínez', 'laura@martinez.coach', 'Emma Walsh', 'emma@walsh.com',
     'pending', 'none', '2026-03-17T16:00:00Z');

  -- ──────────────────────────────────────────────────────────
  -- 8. GOALS (for progress page)
  -- ──────────────────────────────────────────────────────────
  insert into public.goals (client_id, title, progress, status) values
    -- Laura's goals
    (v_laura, 'Career clarity',      70, 'active'),
    (v_laura, 'Self-confidence',     45, 'active'),
    (v_laura, 'Work-life balance',   55, 'active'),

    -- James's goals
    (v_james, 'Delegation skills',   80, 'active'),
    (v_james, 'Executive presence',  65, 'active'),
    (v_james, 'Strategic thinking',  40, 'active'),

    -- Amara's goals (just starting)
    (v_amara, 'Direction finding',   10, 'active'),

    -- Sophie's goals
    (v_sophie, 'Boundary setting',   25, 'active'),
    (v_sophie, 'Resilience',         30, 'active'),
    (v_sophie, 'Career vision',      15, 'active'),

    -- Tom's goals (completed)
    (v_tom, 'Decision clarity',     100, 'completed');

  raise notice '✓ Seed complete — 1 coach, 5 clients, 5 packages, 15 sessions, 10 homework, 6 payments, 3 referrals, 11 goals';

end $$;

commit;
