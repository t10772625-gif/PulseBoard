-- Module: account security — your signed-in devices
-- Supabase keeps one row in auth.sessions per signed-in device / browser. The app
-- can't read auth.* directly, so these two narrow functions let a signed-in user:
--   * list THEIR OWN sessions (device / browser text, IP, when signed in, last active)
--   * sign out ONE of their own sessions, or all others
-- Threat model: only rows with user_id = auth.uid() are ever returned or deleted;
-- no other user's sessions can be seen or ended. Deleting the session row revokes
-- its refresh tokens (auth.refresh_tokens.session_id cascades), so that device is
-- signed out when its current access token expires (Supabase default: within 1 hour).

create or replace function public.list_my_sessions()
returns table (id uuid, created_at timestamptz, last_active timestamptz, user_agent text, ip text, aal text, current boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.created_at,
    coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) as last_active,
    left(coalesce(s.user_agent, ''), 300),
    host(s.ip),
    s.aal::text,
    s.id::text = coalesce(auth.jwt() ->> 'session_id', '')
  from auth.sessions s
  where s.user_id = auth.uid()
  order by coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc
  limit 50
$$;

create or replace function public.revoke_my_session(session uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.sessions s where s.id = session and s.user_id = auth.uid();
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke execute on function public.list_my_sessions() from public, anon;
revoke execute on function public.revoke_my_session(uuid) from public, anon;
grant execute on function public.list_my_sessions() to authenticated;
grant execute on function public.revoke_my_session(uuid) to authenticated;

-- Rollback:
-- drop function if exists public.revoke_my_session(uuid);
-- drop function if exists public.list_my_sessions();
