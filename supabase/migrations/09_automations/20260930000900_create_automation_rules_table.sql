-- Module: automations (workflow rules)
create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  trigger text not null check (trigger in ('created', 'priority_high', 'status_done', 'assigned', 'overdue')),
  action text not null check (action in ('notify_owner', 'assign_me', 'set_high', 'add_label', 'webhook')),
  param text,
  active boolean not null default true,
  runs int not null default 0,
  created_at timestamptz not null default now()
);
create index automation_rules_workspace_id_idx on public.automation_rules (workspace_id);
