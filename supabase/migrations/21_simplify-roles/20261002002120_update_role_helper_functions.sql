-- Module: simplified roles
-- Role helpers without Owner. Admin = full access (can't be restricted by the
-- matrix); is_creator() marks the protected workspace creator.
-- Same signatures and grants as before (18_security-hardening …1820).

create or replace function public.is_creator(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.workspaces w where w.id = ws and w.created_by = auth.uid())
$$;

create or replace function public.is_admin(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.member_role_in(ws) = 'Admin' $$;

create or replace function public.can_edit(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.member_role_in(ws) in ('Admin', 'Sub Admin', 'Member') $$;

create or replace function public.default_permission(r public.member_role, perm text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when r = 'Admin' then true
    when r = 'Sub Admin' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.clients', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create', 'project.manage', 'client.manage', 'data.export')
    when r = 'Member' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create')
    else perm in ('page.dashboard', 'page.projects', 'page.inbox', 'page.team')
  end
$$;

create or replace function public.has_permission(ws uuid, perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.member_role;
begin
  r := public.member_role_in(ws);
  if r is null then return false; end if;
  -- Admin always has everything; the matrix can't take it away
  if r = 'Admin' then return true; end if;
  -- Viewer never gets an action, whatever the matrix says
  if r = 'Viewer' and perm not like 'page.%' then return false; end if;
  return coalesce(
    (select allowed from public.role_permissions where workspace_id = ws and role = r and permission = perm),
    public.default_permission(r, perm)
  );
end;
$$;

revoke execute on function public.is_creator(uuid) from public, anon;
grant execute on function public.is_creator(uuid) to authenticated, service_role;

-- Rollback: re-run the previous definitions from
-- 17_sub-admin-role/20260930001710_update_role_helpers_for_sub_admin.sql and
-- drop function public.is_creator(uuid);
