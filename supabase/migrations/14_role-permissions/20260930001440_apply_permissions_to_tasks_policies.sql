-- Module: role permissions (RBAC)
-- Replace the fixed role checks from 04_tasks with the permission matrix.
-- Updates only need membership here; the trigger above checks the exact action.
drop policy if exists "tasks: editors insert" on public.tasks;
drop policy if exists "tasks: editors update" on public.tasks;
drop policy if exists "tasks: admins hard delete" on public.tasks;

create policy "tasks: create" on public.tasks for insert with check (
  public.has_permission(workspace_id, 'task.create')
  and exists (select 1 from public.projects p where p.id = project_id and p.workspace_id = tasks.workspace_id)
);
create policy "tasks: update" on public.tasks for update
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "tasks: hard delete" on public.tasks for delete using (public.has_permission(workspace_id, 'task.delete'));

drop policy if exists "attachments: editors add" on public.attachments;
create policy "attachments: add" on public.attachments for insert
  with check (public.has_permission(workspace_id, 'task.edit') and uploaded_by = auth.uid());
