-- Module: auth & workspaces
-- Who belongs to which workspace, with their role and task capacity
-- (capacity drives workload balancing).
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'Member',
  capacity int not null default 5 check (capacity > 0),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
