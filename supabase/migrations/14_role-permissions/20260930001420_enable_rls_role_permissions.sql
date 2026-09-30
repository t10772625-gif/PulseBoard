-- Module: role permissions (RBAC)
-- Everyone in the workspace can read the matrix (the UI needs it).
-- Owner edits Admin/Member/Viewer; an Admin with member.manage edits Member/Viewer
-- only, so an Admin can never raise their own rights.
alter table public.role_permissions enable row level security;

create policy "role_permissions: read" on public.role_permissions for select using (public.is_member(workspace_id));

create policy "role_permissions: manage" on public.role_permissions for all
  using (
    public.member_role_in(workspace_id) = 'Owner'
    or (public.member_role_in(workspace_id) = 'Admin' and role in ('Member', 'Viewer') and public.has_permission(workspace_id, 'member.manage'))
  )
  with check (
    role <> 'Owner'
    and (
      public.member_role_in(workspace_id) = 'Owner'
      or (public.member_role_in(workspace_id) = 'Admin' and role in ('Member', 'Viewer') and public.has_permission(workspace_id, 'member.manage'))
    )
  );
