-- Module: security hardening
-- These tables allowed UPDATE on every column, including workspace_id and
-- parent ids. A user who manages two workspaces could move rows between them;
-- moving a project into a Free workspace also skipped the 1-project limit
-- (that trigger only runs on INSERT). Users could also re-point their own
-- notifications at any workspace id.
--
-- UPDATE is now limited to the editable columns. Columns not listed (id,
-- workspace_id, project_id on columns, user_id / message on notifications,
-- created_at) can no longer change. The app's current updates only touch
-- listed columns: clients (name, email, hourly_rate, budget, report_day),
-- automation_rules (active), notifications (read_at); projects and
-- board_columns are not updated in place today.
-- tasks are not changed here: the tasks_permission_check trigger already blocks
-- moving a task to another workspace. role_permissions is not changed: the app
-- upserts it, and its policies already pin the row to the caller's workspace.

revoke update on public.projects from authenticated;
grant update (name, description, color, gradient) on public.projects to authenticated;

revoke update on public.board_columns from authenticated;
grant update (status_key, label, wip_limit, position) on public.board_columns to authenticated;

revoke update on public.clients from authenticated;
grant update (project_id, name, email, hourly_rate, budget, report_day) on public.clients to authenticated;

revoke update on public.automation_rules from authenticated;
grant update (name, "trigger", "action", param, active, runs) on public.automation_rules to authenticated;

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- A client's linked project must be in the client's workspace
drop policy if exists "clients: manage" on public.clients;
create policy "clients: manage" on public.clients for all
  using (public.has_permission(workspace_id, 'client.manage'))
  with check (
    public.has_permission(workspace_id, 'client.manage')
    and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.workspace_id = clients.workspace_id))
  );

-- Rollback:
-- grant update on public.projects, public.board_columns, public.clients,
--   public.automation_rules, public.notifications to authenticated;
-- drop policy "clients: manage" on public.clients;
-- create policy "clients: manage" on public.clients for all
--   using (public.has_permission(workspace_id, 'client.manage'))
--   with check (public.has_permission(workspace_id, 'client.manage'));
