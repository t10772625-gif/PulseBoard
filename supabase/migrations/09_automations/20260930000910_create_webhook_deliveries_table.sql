-- Module: automations
-- Outgoing webhook delivery log (sent by the server, signed with HMAC, retried on failure).
create table public.webhook_deliveries (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  rule_id uuid references public.automation_rules (id) on delete set null,
  url text not null check (url like 'https://%'),
  event text not null,
  status_code int,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index webhook_deliveries_workspace_idx on public.webhook_deliveries (workspace_id, created_at desc);
