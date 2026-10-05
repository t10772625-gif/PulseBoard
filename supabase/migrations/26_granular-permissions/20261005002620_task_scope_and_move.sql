-- Module: granular permissions (Phase 2, user decision 2026-10-05)
-- Task rules, enforced by the database for every update and hard delete:
--   * status / started_at / completed_at change (drag between columns) → task.move
--   * any other field change                                           → task.edit
--   * soft delete / restore (deleted_at) and hard delete               → task.delete
--   * assignee change → task.assign; archive / unarchive → task.archive (unchanged)
-- task.move, task.edit and task.delete reach only your OWN tasks (created by you or
-- assigned to you, judged on the row as it was BEFORE the change) unless the role
-- also has task.edit_all (edit + move) / task.delete_all. Without the base
-- permission you can't change even your own task.
-- Replaces check_task_update_permissions() from 14_role-permissions and the
-- "tasks: hard delete" policy. Requires …2600 (tasks.created_by).

-- true when the caller may do `perm` on a task created by `creator` and assigned to `assignee`
create or replace function public.task_permitted(ws uuid, perm text, all_perm text, creator uuid, assignee uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select public.has_permission(ws, perm)
     and (public.has_permission(ws, all_perm)
          or (auth.uid() is not null and (creator = auth.uid() or assignee = auth.uid())))
$$;
revoke execute on function public.task_permitted(uuid, text, text, uuid, uuid) from public, anon;
grant execute on function public.task_permitted(uuid, text, text, uuid, uuid) to authenticated, service_role;

create or replace function public.check_task_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := new.workspace_id;
  -- fields handled by their own permission; everything else is "edit"
  special text[] := array['deleted_at', 'archived_at', 'assignee_id', 'status', 'started_at', 'completed_at', 'created_by'];
begin
  if auth.uid() is null then return new; end if; -- server roles

  if new.workspace_id <> old.workspace_id then
    raise exception 'A task cannot be moved to another workspace' using errcode = '42501';
  end if;
  if new.project_id <> old.project_id
     and not exists (select 1 from public.projects p where p.id = new.project_id and p.workspace_id = ws) then
    raise exception 'That project is not in this workspace' using errcode = '42501';
  end if;

  if (old.deleted_at is null) <> (new.deleted_at is null)
     and not public.task_permitted(ws, 'task.delete', 'task.delete_all', old.created_by, old.assignee_id) then
    raise exception 'Your role is not allowed to delete or restore this task' using errcode = '42501';
  end if;
  if old.archived_at is distinct from new.archived_at and not public.has_permission(ws, 'task.archive') then
    raise exception 'Your role is not allowed to archive tasks' using errcode = '42501';
  end if;
  if old.assignee_id is distinct from new.assignee_id and not public.has_permission(ws, 'task.assign') then
    raise exception 'Your role is not allowed to assign tasks' using errcode = '42501';
  end if;
  if (old.status is distinct from new.status
      or old.started_at is distinct from new.started_at
      or old.completed_at is distinct from new.completed_at)
     and not public.task_permitted(ws, 'task.move', 'task.edit_all', old.created_by, old.assignee_id) then
    raise exception 'Your role is not allowed to move this task' using errcode = '42501';
  end if;
  if (to_jsonb(new) - special) <> (to_jsonb(old) - special)
     and not public.task_permitted(ws, 'task.edit', 'task.edit_all', old.created_by, old.assignee_id) then
    raise exception 'Your role is not allowed to edit this task' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.check_task_update_permissions() from public, anon, authenticated;

drop policy if exists "tasks: hard delete" on public.tasks;
create policy "tasks: hard delete" on public.tasks
  for delete to authenticated
  using (public.task_permitted(tasks.workspace_id, 'task.delete', 'task.delete_all', tasks.created_by, tasks.assignee_id));

-- Rollback:
-- re-run 14_role-permissions/20260930001430_create_task_permission_check_trigger.sql, then
-- drop policy if exists "tasks: hard delete" on public.tasks;
-- create policy "tasks: hard delete" on public.tasks for delete to authenticated using (public.has_permission(workspace_id, 'task.delete'));
-- drop function if exists public.task_permitted(uuid, text, text, uuid, uuid);
