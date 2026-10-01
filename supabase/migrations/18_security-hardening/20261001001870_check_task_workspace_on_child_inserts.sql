-- Module: security hardening
-- attachments, task_events and notifications checked the caller's rights on
-- workspace_id, but not that task_id belongs to that same workspace. A row
-- could reference another workspace's task (and the foreign-key error told
-- the caller whether a guessed task id exists). attachments.storage_path was
-- also not tied to the workspace folder in the task-files bucket.
-- Each INSERT policy below is the previous one plus the missing check.
-- The app always uses its own workspace, so its inserts are unaffected.

-- Attachments: task in the same workspace; file stored under that workspace's folder
drop policy if exists "attachments: add" on public.attachments;
create policy "attachments: add" on public.attachments for insert
  with check (
    public.has_permission(workspace_id, 'task.edit')
    and uploaded_by = auth.uid()
    and exists (select 1 from public.tasks t where t.id = task_id and t.workspace_id = attachments.workspace_id)
    and split_part(storage_path, '/', 1) = workspace_id::text
  );

-- Activity / audit events: task (when given) in the same workspace
drop policy if exists "task_events: editors append" on public.task_events;
create policy "task_events: editors append" on public.task_events for insert
  with check (
    public.can_edit(workspace_id)
    and actor_id = auth.uid()
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.workspace_id = task_events.workspace_id))
  );

-- Notifications: recipient is a member, task (when given) in the same workspace
drop policy if exists "notifications: teammates create" on public.notifications;
create policy "notifications: teammates create" on public.notifications for insert
  with check (
    public.can_edit(workspace_id)
    and exists (select 1 from public.workspace_members m where m.workspace_id = notifications.workspace_id and m.user_id = notifications.user_id)
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.workspace_id = notifications.workspace_id))
  );

-- Rollback (previous policies):
-- drop policy "attachments: add" on public.attachments;
-- create policy "attachments: add" on public.attachments for insert
--   with check (public.has_permission(workspace_id, 'task.edit') and uploaded_by = auth.uid());
-- drop policy "task_events: editors append" on public.task_events;
-- create policy "task_events: editors append" on public.task_events for insert
--   with check (public.can_edit(workspace_id) and actor_id = auth.uid());
-- drop policy "notifications: teammates create" on public.notifications;
-- create policy "notifications: teammates create" on public.notifications for insert
--   with check (public.can_edit(workspace_id) and exists (select 1 from public.workspace_members m
--     where m.workspace_id = notifications.workspace_id and m.user_id = notifications.user_id));
