-- Module: granular permissions (Phase 2, user decision 2026-10-05)
-- Boards and columns: one project.manage switch becomes six.
--   projects:      insert → project.create · update → project.edit · delete → project.delete
--   board_columns: insert → column.create · update → column.edit · delete → column.delete,
--                  except that the person creating a board may insert its first columns
--                  (a board with no columns yet) with project.create alone.
-- The app saves only changed columns (repo.syncColumns), so a rename needs only column.edit.
-- Reading is unchanged ("projects: read" / "board_columns: read" = any member).
-- Every new-row column is written as <table>.<column> (lesson from F-2026-10-01-14).

drop policy if exists "projects: manage" on public.projects;
drop policy if exists "projects: create" on public.projects;
drop policy if exists "projects: edit" on public.projects;
drop policy if exists "projects: delete" on public.projects;

create policy "projects: create" on public.projects
  for insert to authenticated
  with check (public.has_permission(projects.workspace_id, 'project.create'));

create policy "projects: edit" on public.projects
  for update to authenticated
  using (public.has_permission(projects.workspace_id, 'project.edit'))
  with check (public.has_permission(projects.workspace_id, 'project.edit'));

create policy "projects: delete" on public.projects
  for delete to authenticated
  using (public.has_permission(projects.workspace_id, 'project.delete'));

drop policy if exists "board_columns: manage" on public.board_columns;
drop policy if exists "board_columns: add" on public.board_columns;
drop policy if exists "board_columns: change" on public.board_columns;
drop policy if exists "board_columns: remove" on public.board_columns;

create policy "board_columns: add" on public.board_columns
  for insert to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = board_columns.project_id
        and (
          public.has_permission(p.workspace_id, 'column.create')
          -- first columns of a brand-new board (rows from the same insert are not
          -- visible to this check, so a whole default column set passes together)
          or (public.has_permission(p.workspace_id, 'project.create')
              and not exists (select 1 from public.board_columns c where c.project_id = p.id))
        )
    )
  );

create policy "board_columns: change" on public.board_columns
  for update to authenticated
  using (exists (select 1 from public.projects p where p.id = board_columns.project_id and public.has_permission(p.workspace_id, 'column.edit')))
  with check (exists (select 1 from public.projects p where p.id = board_columns.project_id and public.has_permission(p.workspace_id, 'column.edit')));

create policy "board_columns: remove" on public.board_columns
  for delete to authenticated
  using (exists (select 1 from public.projects p where p.id = board_columns.project_id and public.has_permission(p.workspace_id, 'column.delete')));

-- Rollback:
-- drop policy if exists "projects: create" on public.projects;
-- drop policy if exists "projects: edit" on public.projects;
-- drop policy if exists "projects: delete" on public.projects;
-- drop policy if exists "board_columns: add" on public.board_columns;
-- drop policy if exists "board_columns: change" on public.board_columns;
-- drop policy if exists "board_columns: remove" on public.board_columns;
-- then re-run 14_role-permissions/20260930001460_apply_permissions_to_projects_and_columns_policies.sql
