-- Module: role permissions (RBAC)
-- An UPDATE can mean delete (deleted_at), archive, reassign or a normal edit.
-- RLS can't tell these apart, so this trigger checks the matching permission.
-- Runs only for signed-in users (auth.uid() is null for the service role / SQL editor).
create or replace function public.check_task_update_permissions()
returns trigger language plpgsql security definer set search_path = public
as $$
declare ws uuid := new.workspace_id;
begin
  if auth.uid() is null then return new; end if;

  if new.workspace_id <> old.workspace_id then
    raise exception 'A task cannot be moved to another workspace';
  end if;
  if new.project_id <> old.project_id
     and not exists (select 1 from public.projects p where p.id = new.project_id and p.workspace_id = ws) then
    raise exception 'That project is not in this workspace';
  end if;

  if (old.deleted_at is null) <> (new.deleted_at is null) and not public.has_permission(ws, 'task.delete') then
    raise exception 'Your role is not allowed to delete or restore tasks';
  end if;
  if old.archived_at is distinct from new.archived_at and not public.has_permission(ws, 'task.archive') then
    raise exception 'Your role is not allowed to archive tasks';
  end if;
  if old.assignee_id is distinct from new.assignee_id and not public.has_permission(ws, 'task.assign') then
    raise exception 'Your role is not allowed to assign tasks';
  end if;
  if (to_jsonb(new) - 'deleted_at' - 'archived_at' - 'assignee_id') <> (to_jsonb(old) - 'deleted_at' - 'archived_at' - 'assignee_id')
     and not public.has_permission(ws, 'task.edit') then
    raise exception 'Your role is not allowed to edit tasks';
  end if;
  return new;
end;
$$;

create trigger tasks_permission_check
  before update on public.tasks
  for each row execute function public.check_task_update_permissions();
