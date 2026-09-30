-- Module: projects (boards)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  description text not null default '',
  color text not null default '#12B5A0',
  gradient text not null default '#3A86FF',
  created_at timestamptz not null default now()
);
create index projects_workspace_id_idx on public.projects (workspace_id);
