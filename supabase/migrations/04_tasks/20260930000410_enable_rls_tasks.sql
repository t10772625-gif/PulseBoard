-- Module: tasks
-- Members read; Owner/Admin/Member write; Viewers are read-only.
-- A task's project must be in the same workspace (no cross-tenant inserts).
alter table public.tasks enable row level security;

create policy "tasks: read" on public.tasks for select using (public.is_member(workspace_id));
create policy "tasks: editors insert" on public.tasks for insert with check (
  public.can_edit(workspace_id)
  and exists (select 1 from public.projects p where p.id = project_id and p.workspace_id = tasks.workspace_id)
);
create policy "tasks: editors update" on public.tasks for update
  using (public.can_edit(workspace_id)) with check (public.can_edit(workspace_id));
create policy "tasks: admins hard delete" on public.tasks for delete using (public.is_admin(workspace_id));
