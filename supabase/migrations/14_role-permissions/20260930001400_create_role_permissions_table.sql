-- Module: role permissions (RBAC)
-- Per-workspace overrides of what each role may see and do. Missing rows fall
-- back to the defaults in public.default_permission(). The Owner is never restricted.
create table public.role_permissions (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  role public.member_role not null check (role <> 'Owner'),
  permission text not null check (permission ~ '^(page|task|comment|share|project|member|client|automation|data)\.[a-z_]+$'),
  allowed boolean not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, role, permission)
);
