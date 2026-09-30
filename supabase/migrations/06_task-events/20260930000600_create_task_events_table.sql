-- Module: task events (history, audit log, activity feed, analytics)
-- One append-only log. Analytics (burnup, CFD, cycle time, aging) read from_status/to_status.
create table public.task_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  actor_id uuid references auth.users (id) on delete set null,
  type text not null,
  message text not null,
  from_status text,
  to_status text,
  created_at timestamptz not null default now()
);
create index task_events_workspace_time_idx on public.task_events (workspace_id, created_at desc);
create index task_events_task_id_idx on public.task_events (task_id);
