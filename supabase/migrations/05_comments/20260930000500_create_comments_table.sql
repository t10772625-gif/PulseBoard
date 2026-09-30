-- Module: comments
-- Threaded task comments (parent_id) with likes.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (length(body) between 1 and 5000),
  liked_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index comments_task_id_idx on public.comments (task_id);
