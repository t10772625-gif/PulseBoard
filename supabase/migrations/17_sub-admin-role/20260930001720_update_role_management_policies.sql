-- Module: Sub Admin role
-- Who controls whom:
--   Owner  → everything (Admin, Sub Admin, Member, Viewer rows of the matrix; any role)
--   Admin  → the matrix rows of Sub Admin, Member and Viewer; can add/change/remove
--            Sub Admins, Members and Viewers, but not Admins or the Owner
-- A Viewer row can only allow pages (view-only role).

drop policy if exists "role_permissions: manage" on public.role_permissions;
create policy "role_permissions: manage" on public.role_permissions for all
  using (
    public.member_role_in(workspace_id) = 'Owner'
    or (public.member_role_in(workspace_id) = 'Admin' and role in ('Sub Admin', 'Member', 'Viewer') and public.has_permission(workspace_id, 'member.manage'))
  )
  with check (
    role <> 'Owner'
    and (role <> 'Viewer' or permission like 'page.%' or allowed = false)
    and (
      public.member_role_in(workspace_id) = 'Owner'
      or (public.member_role_in(workspace_id) = 'Admin' and role in ('Sub Admin', 'Member', 'Viewer') and public.has_permission(workspace_id, 'member.manage'))
    )
  );

-- Only the Owner can grant, change or remove the Owner and Admin roles
drop policy if exists "members: add" on public.workspace_members;
drop policy if exists "members: change" on public.workspace_members;
drop policy if exists "members: remove" on public.workspace_members;

create policy "members: add" on public.workspace_members for insert with check (
  public.has_permission(workspace_id, 'member.manage')
  and (role not in ('Owner', 'Admin') or public.member_role_in(workspace_id) = 'Owner')
);
create policy "members: change" on public.workspace_members for update
  using (public.has_permission(workspace_id, 'member.manage') and (role not in ('Owner', 'Admin') or public.member_role_in(workspace_id) = 'Owner'))
  with check (public.has_permission(workspace_id, 'member.manage') and (role not in ('Owner', 'Admin') or public.member_role_in(workspace_id) = 'Owner'));
create policy "members: remove" on public.workspace_members for delete
  using (public.has_permission(workspace_id, 'member.manage') and (role not in ('Owner', 'Admin') or public.member_role_in(workspace_id) = 'Owner'));
