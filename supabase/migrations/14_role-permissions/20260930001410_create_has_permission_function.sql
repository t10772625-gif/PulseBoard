-- Module: role permissions (RBAC)
-- Defaults must match DEFAULT_PERMISSIONS in src/lib/permissions.ts.
create or replace function public.default_permission(r public.member_role, perm text)
returns boolean language sql immutable
as $$
  select case
    when r in ('Owner', 'Admin') then true
    when r = 'Member' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create')
    else perm in ('page.dashboard', 'page.projects', 'page.inbox', 'page.team')
  end
$$;

-- Does the signed-in user have this permission in this workspace?
create or replace function public.has_permission(ws uuid, perm text)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare r public.member_role;
begin
  r := public.member_role_in(ws);
  if r is null then return false; end if;
  if r = 'Owner' then return true; end if;
  return coalesce(
    (select allowed from public.role_permissions where workspace_id = ws and role = r and permission = perm),
    public.default_permission(r, perm)
  );
end;
$$;
