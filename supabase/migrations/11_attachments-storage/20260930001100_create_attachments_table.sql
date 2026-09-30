-- Module: attachments & storage
-- One row per uploaded file. size_bytes feeds the per-plan storage quota.
-- Files live in the private 'task-files' bucket at <workspace_id>/<task_id>/<file name>.
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index attachments_workspace_idx on public.attachments (workspace_id);
create index attachments_task_idx on public.attachments (task_id);
