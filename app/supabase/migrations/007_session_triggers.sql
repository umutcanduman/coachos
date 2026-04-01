-- ============================================================
-- 007: Auto-sync packages.used_sessions from sessions table
-- Trigger fires on session INSERT, UPDATE, DELETE
-- and recalculates used_sessions for the client's active package
-- ============================================================

create or replace function public.sync_package_used_sessions()
returns trigger as $$
declare
  target_client_id uuid;
begin
  -- Determine which client_id to recalculate for
  if tg_op = 'DELETE' then
    target_client_id := old.client_id;
  else
    target_client_id := new.client_id;
  end if;

  -- Count completed sessions for this client
  update public.packages
  set used_sessions = (
    select count(*)
    from public.sessions
    where sessions.client_id = target_client_id
      and sessions.status = 'completed'
  )
  where packages.client_id = target_client_id
    and packages.status = 'active';

  -- If the old record had a different client_id (unlikely but safe),
  -- also recalculate for the old client
  if tg_op = 'UPDATE' and old.client_id != new.client_id then
    update public.packages
    set used_sessions = (
      select count(*)
      from public.sessions
      where sessions.client_id = old.client_id
        and sessions.status = 'completed'
    )
    where packages.client_id = old.client_id
      and packages.status = 'active';
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Drop if exists to allow re-running
drop trigger if exists trg_sync_used_sessions on public.sessions;

create trigger trg_sync_used_sessions
  after insert or update or delete on public.sessions
  for each row
  execute function public.sync_package_used_sessions();
