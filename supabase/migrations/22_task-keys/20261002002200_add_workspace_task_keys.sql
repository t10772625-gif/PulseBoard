-- Module: task keys ("PB-123")
-- Every workspace has a short task prefix (Admin can change it in Settings), and
-- every task gets a number that counts up inside its workspace. The key shown in
-- the app is <workspaces.task_prefix>-<tasks.number>. The task's uuid stays the
-- primary key; the key is an extra, readable identifier. Numbers are handed out by
-- the database, never by the browser, so two people creating tasks at once can't
-- get the same number, and a number never changes (also not when a task moves to
-- another board). Different workspaces each start at 1 and may use the same prefix.

alter table public.workspaces
  add column if not exists task_prefix text check (task_prefix ~ '^[A-Z][A-Z0-9]{1,5}$'),
  add column if not exists next_task_number int not null default 1 check (next_task_number >= 1);

alter table public.tasks
  add column if not exists number int check (number >= 1);

-- Suggested prefix from a workspace name: initials of the first words ("Pulse
-- Board" → "PB"), or the first letters of one word ("Northwind" → "NOR"); "PB"
-- when nothing usable is left. Same algorithm as suggestPrefix() in src/lib/task-keys.ts.
create or replace function public.suggest_task_prefix(ws_name text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  words text[] := array_remove(regexp_split_to_array(upper(regexp_replace(coalesce(ws_name, ''), '[^A-Za-z0-9 ]', '', 'g')), '\s+'), '');
  base text := '';
begin
  -- A name ending in " workspace" (the sign-up default) doesn't count
  if array_length(words, 1) >= 2 and words[array_length(words, 1)] = 'WORKSPACE' then
    words := words[1 : array_length(words, 1) - 1];
  end if;
  if array_length(words, 1) >= 2 then
    for j in 1 .. least(array_length(words, 1), 4) loop
      base := base || left(words[j], 1);
    end loop;
  elsif array_length(words, 1) = 1 then
    base := left(words[1], 3);
  end if;
  base := regexp_replace(base, '^[0-9]+', '');
  if char_length(base) < 2 then
    return 'PB';
  end if;
  return left(base, 6);
end;
$$;

-- Backfill: prefix for every workspace, numbers for existing tasks (oldest first)
update public.workspaces set task_prefix = public.suggest_task_prefix(name) where task_prefix is null;

with numbered as (
  select t.id, row_number() over (partition by t.workspace_id order by t.created_at, t.id) as n
  from public.tasks t
  where t.number is null
)
update public.tasks t set number = numbered.n from numbered where numbered.id = t.id;

update public.workspaces w
set next_task_number = coalesce((select max(t.number) from public.tasks t where t.workspace_id = w.id), 0) + 1;

alter table public.workspaces alter column task_prefix set not null;
alter table public.tasks alter column number set not null;
create unique index if not exists tasks_workspace_number_uidx on public.tasks (workspace_id, number);

-- New workspace (sign-up): prefix from its name, counter at 1
create or replace function public.set_workspace_task_prefix()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.task_prefix is null or new.task_prefix = '' then
    new.task_prefix := public.suggest_task_prefix(new.name);
  end if;
  new.next_task_number := 1;
  return new;
end;
$$;
drop trigger if exists workspaces_set_task_prefix on public.workspaces;
create trigger workspaces_set_task_prefix
  before insert on public.workspaces
  for each row execute function public.set_workspace_task_prefix();

-- Task number: taken from the workspace counter on insert; any later change to
-- number from the browser is ignored (kept as it was)
create or replace function public.assign_task_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.workspaces
    set next_task_number = next_task_number + 1
    where id = new.workspace_id
    returning next_task_number - 1 into new.number;
  else
    new.number := old.number;
  end if;
  return new;
end;
$$;
drop trigger if exists tasks_assign_number on public.tasks;
create trigger tasks_assign_number
  before insert or update of number on public.tasks
  for each row execute function public.assign_task_number();

-- Browsers read the prefix and numbers; an Admin may change the prefix (the
-- "workspaces: admins rename" policy from 21_simplify-roles applies). The counter
-- is never writable from the browser.
grant select (task_prefix, next_task_number) on public.workspaces to authenticated;
grant update (task_prefix) on public.workspaces to authenticated;
grant select (number) on public.tasks to authenticated;

revoke execute on function public.suggest_task_prefix(text) from public, anon;
grant execute on function public.suggest_task_prefix(text) to authenticated, service_role;
revoke execute on function public.set_workspace_task_prefix() from public, anon, authenticated;
revoke execute on function public.assign_task_number() from public, anon, authenticated;

-- Rollback:
-- drop trigger if exists tasks_assign_number on public.tasks;
-- drop trigger if exists workspaces_set_task_prefix on public.workspaces;
-- drop function if exists public.assign_task_number();
-- drop function if exists public.set_workspace_task_prefix();
-- drop index if exists public.tasks_workspace_number_uidx;
-- alter table public.tasks drop column if exists number;
-- alter table public.workspaces drop column if exists task_prefix, drop column if exists next_task_number;
-- drop function if exists public.suggest_task_prefix(text);
