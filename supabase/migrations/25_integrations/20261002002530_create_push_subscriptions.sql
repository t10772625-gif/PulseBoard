-- Module: integrations — browser push notifications (Web Push, free)
-- Each browser that allows notifications stores its push subscription here (the
-- endpoint URL plus its two public keys). Pushes are signed by the server with the
-- VAPID private key (server-only env var), so an endpoint alone can't be used to
-- send anything.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: own" on public.push_subscriptions
  for all to authenticated
  using (push_subscriptions.user_id = auth.uid())
  with check (push_subscriptions.user_id = auth.uid());

grant select, delete on public.push_subscriptions to authenticated;
grant insert (endpoint, p256dh, auth) on public.push_subscriptions to authenticated;

-- Push to teammates (e.g. "you were assigned"): the server needs the target's
-- subscriptions. Only for people who share that workspace with the caller.
create or replace function public.push_targets(ws uuid, people uuid[])
returns table (user_id uuid, endpoint text, p256dh text, auth text)
language sql
stable
security definer
set search_path = public
as $$
  select s.user_id, s.endpoint, s.p256dh, s.auth
  from public.push_subscriptions s
  join public.workspace_members m on m.user_id = s.user_id and m.workspace_id = ws
  where public.is_member(ws) and s.user_id = any (people)
$$;
revoke execute on function public.push_targets(uuid, uuid[]) from public, anon;
grant execute on function public.push_targets(uuid, uuid[]) to authenticated;

-- Rollback:
-- drop function if exists public.push_targets(uuid, uuid[]);
-- drop table if exists public.push_subscriptions;
