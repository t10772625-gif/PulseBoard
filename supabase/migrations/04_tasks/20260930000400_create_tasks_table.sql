-- Module: tasks
-- Everything a task card and the task drawer show. deleted_at = soft delete
-- (trash + undo), archived_at = archive.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  status text not null default 'todo',
  title text not null check (length(title) between 1 and 300),
  description text not null default '',
  priority text not null default 'm' check (priority in ('h', 'm', 'l')),
  assignee_id uuid references auth.users (id) on delete set null,
  due_date date,
  labels text[] not null default '{}',
  subtasks jsonb not null default '[]',
  checklist jsonb not null default '[]',
  custom_fields jsonb not null default '{}',
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  estimate_hours numeric check (estimate_hours >= 0),
  energy text check (energy in ('high', 'low')),
  billable boolean not null default false,
  module text,
  approval text not null default 'none' check (approval in ('none', 'requested', 'approved', 'rejected')),
  blocked_by uuid references public.tasks (id) on delete set null,
  tracked_seconds int not null default 0 check (tracked_seconds >= 0),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz
);
create index tasks_workspace_id_idx on public.tasks (workspace_id);
create index tasks_board_idx on public.tasks (project_id, status) where deleted_at is null and archived_at is null;
create index tasks_assignee_idx on public.tasks (assignee_id) where deleted_at is null;
