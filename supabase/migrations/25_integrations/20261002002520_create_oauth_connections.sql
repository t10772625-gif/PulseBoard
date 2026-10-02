-- Module: integrations — a person's own Google connection (Gmail send + Calendar free/busy)
-- Scopes asked for (minimum, CLAUDE.md §11.2): openid email, gmail.send (send mail
-- as you, Google calls it "sensitive" — no CASA audit), calendar.freebusy (only
-- busy / free blocks, never event titles). The refresh token is encrypted by the
-- server (AES-256-GCM, INTEGRATION_ENCRYPTION_KEY) before it is stored; the browser
-- only ever sees the ciphertext of its own token, which is useless without the key.

create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  provider text not null check (provider in ('google')),
  account_email text not null check (char_length(account_email) <= 320),
  scopes text not null check (char_length(scopes) <= 1000),
  refresh_token_enc text not null check (char_length(refresh_token_enc) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
alter table public.oauth_connections enable row level security;

create policy "oauth_connections: own" on public.oauth_connections
  for all to authenticated
  using (oauth_connections.user_id = auth.uid())
  with check (oauth_connections.user_id = auth.uid());

grant select, delete on public.oauth_connections to authenticated;
grant insert (provider, account_email, scopes, refresh_token_enc) on public.oauth_connections to authenticated;
-- provider is included only because an upsert re-sets every column it sends (CHECK keeps it to "google")
grant update (provider, account_email, scopes, refresh_token_enc, updated_at) on public.oauth_connections to authenticated;

-- Meeting scheduler: teammates' free/busy. Returns, for the given people who share
-- a workspace with the caller and have connected Google, their ENCRYPTED refresh
-- token, so the server can ask Google for busy blocks only. A caller who is not a
-- member of that workspace gets nothing. Only the server can decrypt the tokens.
create or replace function public.freebusy_tokens(ws uuid, people uuid[])
returns table (user_id uuid, refresh_token_enc text)
language sql
stable
security definer
set search_path = public
as $$
  select c.user_id, c.refresh_token_enc
  from public.oauth_connections c
  join public.workspace_members m on m.user_id = c.user_id and m.workspace_id = ws
  where public.is_member(ws)
    and c.provider = 'google'
    and c.user_id = any (people)
    and position('calendar.freebusy' in c.scopes) > 0
$$;
revoke execute on function public.freebusy_tokens(uuid, uuid[]) from public, anon;
grant execute on function public.freebusy_tokens(uuid, uuid[]) to authenticated;

-- Who in the workspace has connected Google (for the scheduler's "connected" marks)
create or replace function public.google_connected_members(ws uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.user_id
  from public.oauth_connections c
  join public.workspace_members m on m.user_id = c.user_id and m.workspace_id = ws
  where public.is_member(ws) and c.provider = 'google'
$$;
revoke execute on function public.google_connected_members(uuid) from public, anon;
grant execute on function public.google_connected_members(uuid) to authenticated;

-- Rollback:
-- drop function if exists public.google_connected_members(uuid);
-- drop function if exists public.freebusy_tokens(uuid, uuid[]);
-- drop table if exists public.oauth_connections;
