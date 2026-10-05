-- Module: granular permissions (Phase 2, user decision 2026-10-05)
-- Who created each task, so "own tasks only" can be checked. A task is yours when
-- you created it OR it is assigned to you (see …2620).
-- The value is set by the database, never by the browser: tasks has a table-wide
-- INSERT/UPDATE grant (15_api-grants), so without this trigger anyone could insert
-- a task "created by" someone else, or claim a task by rewriting created_by.

alter table public.tasks
  add column if not exists created_by uuid references auth.users (id) on delete set null;

create index if not exists tasks_created_by_idx on public.tasks (workspace_id, created_by);

-- On insert: always the signed-in user (server roles without a user keep what they send).
-- On update: never changes.
create or replace function public.stamp_task_creator()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
    end if;
  else
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_stamp_creator on public.tasks;
create trigger tasks_stamp_creator
  before insert or update on public.tasks
  for each row execute function public.stamp_task_creator();
revoke execute on function public.stamp_task_creator() from public, anon, authenticated;

-- Existing tasks have no recorded creator (live DB on 2026-10-05: 0 tasks). Their
-- assignee still counts as "own"; an Admin / Sub Admin (edit-all) can edit them.

-- Rollback:
-- drop trigger if exists tasks_stamp_creator on public.tasks;
-- drop function if exists public.stamp_task_creator();
-- drop index if exists public.tasks_created_by_idx;
-- alter table public.tasks drop column if exists created_by;
