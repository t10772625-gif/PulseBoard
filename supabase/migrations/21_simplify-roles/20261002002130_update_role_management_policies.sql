-- Module: simplified roles
-- Who may manage roles and members now that Owner is gone:
--   * Admin edits the Sub Admin / Member / Viewer matrix rows (Admin rows don't exist)
--   * granting, changing or removing an Admin needs an Admin
--   * the workspace creator can't be demoted or removed by anyone (not even themselves:
--     a workspace must keep its protected Admin; ownership transfer comes later)
--   * any Admin may rename the workspace; nobody changes the plan here
-- Every new-row column is written as <table>.<column> (lesson from F-2026-10-01-14).

drop policy if exists "role_permissions: manage" on public.role_permissions;
create policy "role_permissions: manage" on public.role_permissions
  for all to authenticated
  using (
    public.is_admin(role_permissions.workspace_id)
    and role_permissions.role in ('Sub Admin', 'Member', 'Viewer')
  )
  with check (
    public.is_admin(role_permissions.workspace_id)
    and role_permissions.role in ('Sub Admin', 'Member', 'Viewer')
    and (role_permissions.role <> 'Viewer' or role_permissions.permission like 'page.%' or role_permissions.allowed = false)
  );

drop policy if exists "invites: managers create" on public.workspace_invites;
create policy "invites: managers create" on public.workspace_invites
  for insert to authenticated
  with check (
    public.has_permission(workspace_invites.workspace_id, 'member.manage')
    and workspace_invites.invited_by = auth.uid()
    and (workspace_invites.role <> 'Admin' or public.is_admin(workspace_invites.workspace_id))
    and workspace_invites.accepted_at is null
    and workspace_invites.accepted_by is null
    and workspace_invites.revoked_at is null
  );

drop policy if exists "members: change" on public.workspace_members;
create policy "members: change" on public.workspace_members
  for update to authenticated
  using (
    public.has_permission(workspace_members.workspace_id, 'member.manage')
    and (workspace_members.role <> 'Admin' or public.is_admin(workspace_members.workspace_id))
    and not exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.created_by = workspace_members.user_id)
  )
  with check (
    public.has_permission(workspace_members.workspace_id, 'member.manage')
    and (workspace_members.role <> 'Admin' or public.is_admin(workspace_members.workspace_id))
    and not exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.created_by = workspace_members.user_id)
  );

drop policy if exists "members: remove" on public.workspace_members;
create policy "members: remove" on public.workspace_members
  for delete to authenticated
  using (
    public.has_permission(workspace_members.workspace_id, 'member.manage')
    and (workspace_members.role <> 'Admin' or public.is_admin(workspace_members.workspace_id))
    and not exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.created_by = workspace_members.user_id)
  );

drop policy if exists "workspaces: owner renames" on public.workspaces;
drop policy if exists "workspaces: admins rename" on public.workspaces;
create policy "workspaces: admins rename" on public.workspaces
  for update to authenticated
  using (public.is_admin(workspaces.id))
  with check (
    public.is_admin(workspaces.id)
    and workspaces.plan = (select w.plan from public.workspaces w where w.id = workspaces.id)
  );

-- Nobody changes their own role (CLAUDE.md §4: a member can't elevate themselves).
-- A policy can't tell a role change from a capacity change on the same row, so a
-- trigger checks it; your own capacity stays editable.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and old.user_id = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists workspace_members_no_self_role on public.workspace_members;
create trigger workspace_members_no_self_role
  before update on public.workspace_members
  for each row execute function public.prevent_self_role_change();
revoke execute on function public.prevent_self_role_change() from public, anon, authenticated;

-- Rollback: drop trigger workspace_members_no_self_role on public.workspace_members;
-- drop function public.prevent_self_role_change(); then re-run the policies from 17_sub-admin-role/20260930001720_update_role_management_policies.sql,
-- 16_workspace-invites/20260930001610_enable_rls_workspace_invites.sql and
-- 01_auth-and-workspaces/20260930000160_enable_rls_workspaces.sql, then
-- drop policy "workspaces: admins rename" on public.workspaces;
