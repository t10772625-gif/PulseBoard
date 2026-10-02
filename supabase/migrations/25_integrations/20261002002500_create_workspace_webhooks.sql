-- Module: integrations — Slack / Discord incoming webhooks (outbound notifications)
-- An incoming-webhook URL is a secret (anyone with it can post to that channel).
-- The browser never stores it in clear text: the server encrypts it (AES-256-GCM,
-- key in the server-only INTEGRATION_ENCRYPTION_KEY env var) before inserting, and
-- only the server can decrypt it to post. Members may read the row (they need to
-- know a channel is connected); the ciphertext is useless without the server key.

create table if not exists public.workspace_webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('slack', 'discord')),
  url_enc text not null check (char_length(url_enc) between 20 and 2000),
  url_hint text not null check (char_length(url_hint) <= 120),
  events text[] not null default array['task.created', 'task.done', 'task.high']::text[]
    check (events <@ array['task.created', 'task.done', 'task.high', 'task.assigned']::text[]),
  active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists workspace_webhooks_ws_idx on public.workspace_webhooks (workspace_id);
alter table public.workspace_webhooks enable row level security;

create policy "workspace_webhooks: members read" on public.workspace_webhooks
  for select to authenticated using (public.is_member(workspace_webhooks.workspace_id));
create policy "workspace_webhooks: managers add" on public.workspace_webhooks
  for insert to authenticated with check (public.has_permission(workspace_webhooks.workspace_id, 'automation.manage'));
create policy "workspace_webhooks: managers change" on public.workspace_webhooks
  for update to authenticated
  using (public.has_permission(workspace_webhooks.workspace_id, 'automation.manage'))
  with check (public.has_permission(workspace_webhooks.workspace_id, 'automation.manage'));
create policy "workspace_webhooks: managers remove" on public.workspace_webhooks
  for delete to authenticated using (public.has_permission(workspace_webhooks.workspace_id, 'automation.manage'));

grant select, delete on public.workspace_webhooks to authenticated;
grant insert (workspace_id, kind, url_enc, url_hint, events) on public.workspace_webhooks to authenticated;
grant update (events, active) on public.workspace_webhooks to authenticated;

-- Delivery log: the server writes one row per post, as the member whose action
-- triggered it. created_by lets the server count that member's recent posts
-- (rate limit) without seeing anyone else's.
alter table public.webhook_deliveries
  add column if not exists created_by uuid references auth.users (id) on delete set null default auth.uid(),
  add column if not exists target text check (char_length(target) <= 120);

create policy "webhook_deliveries: members log" on public.webhook_deliveries
  for insert to authenticated
  with check (public.can_edit(webhook_deliveries.workspace_id) and webhook_deliveries.created_by = auth.uid());
create policy "webhook_deliveries: read own" on public.webhook_deliveries
  for select to authenticated using (webhook_deliveries.created_by = auth.uid() and public.is_member(webhook_deliveries.workspace_id));
grant insert (workspace_id, rule_id, url, event, status_code, attempts, target) on public.webhook_deliveries to authenticated;
grant select (created_by, target) on public.webhook_deliveries to authenticated;

-- Rollback:
-- drop policy if exists "webhook_deliveries: read own" on public.webhook_deliveries;
-- drop policy if exists "webhook_deliveries: members log" on public.webhook_deliveries;
-- alter table public.webhook_deliveries drop column if exists target, drop column if exists created_by;
-- drop table if exists public.workspace_webhooks;
