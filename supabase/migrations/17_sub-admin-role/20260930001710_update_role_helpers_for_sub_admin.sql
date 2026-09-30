-- Module: Sub Admin role
-- Defaults must match DEFAULT_PERMISSIONS in src/lib/permissions.ts.
-- Sub Admin: every page except Settings, Integrations and Automations; all task
-- actions; manage boards and clients; export. No member/role management by default.
-- Viewer is view-only: only page permissions can ever be granted to it.
create or replace function public.default_permission(r public.member_role, perm text)
returns boolean language sql immutable set search_path = public
as $$
  select case
    when r in ('Owner', 'Admin') then true
    when r = 'Sub Admin' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.clients', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create', 'project.manage', 'client.manage', 'data.export')
    when r = 'Member' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create')
    else perm in ('page.dashboard', 'page.projects', 'page.inbox', 'page.team')
  end
$$;

create or replace function public.has_permission(ws uuid, perm text)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare r public.member_role;
begin
  r := public.member_role_in(ws);
  if r is null then return false; end if;
  if r = 'Owner' then return true; end if;
  -- Viewer never gets an action, whatever the matrix says
  if r = 'Viewer' and perm not like 'page.%' then return false; end if;
  return coalesce(
    (select allowed from public.role_permissions where workspace_id = ws and role = r and permission = perm),
    public.default_permission(r, perm)
  );
end;
$$;

-- Owner, Admin, Sub Admin and Member can edit; Viewer is read-only
create or replace function public.can_edit(ws uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.member_role_in(ws) in ('Owner', 'Admin', 'Sub Admin', 'Member') $$;
