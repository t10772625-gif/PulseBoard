-- Module: role permissions (RBAC)
-- Inviting, changing roles and removing members follows member.manage.
-- Only the Owner can make someone Owner or change/remove an Owner.
drop policy if exists "members: admins add" on public.workspace_members;
drop policy if exists "members: admins change" on public.workspace_members;
drop policy if exists "members: admins remove" on public.workspace_members;

create policy "members: add" on public.workspace_members for insert with check (
  public.has_permission(workspace_id, 'member.manage')
  and (role <> 'Owner' or public.member_role_in(workspace_id) = 'Owner')
);
create policy "members: change" on public.workspace_members for update
  using (public.has_permission(workspace_id, 'member.manage') and (role <> 'Owner' or public.member_role_in(workspace_id) = 'Owner'))
  with check (public.has_permission(workspace_id, 'member.manage') and (role <> 'Owner' or public.member_role_in(workspace_id) = 'Owner'));
create policy "members: remove" on public.workspace_members for delete
  using (public.has_permission(workspace_id, 'member.manage') and (role <> 'Owner' or public.member_role_in(workspace_id) = 'Owner'));
