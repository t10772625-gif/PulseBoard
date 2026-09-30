-- Module: role permissions (RBAC)
-- Creating boards and managing columns follows project.manage.
drop policy if exists "projects: admins write" on public.projects;
drop policy if exists "board_columns: admins write" on public.board_columns;

create policy "projects: manage" on public.projects for all
  using (public.has_permission(workspace_id, 'project.manage'))
  with check (public.has_permission(workspace_id, 'project.manage'));

create policy "board_columns: manage" on public.board_columns for all using (
  exists (select 1 from public.projects p where p.id = project_id and public.has_permission(p.workspace_id, 'project.manage'))
) with check (
  exists (select 1 from public.projects p where p.id = project_id and public.has_permission(p.workspace_id, 'project.manage'))
);
