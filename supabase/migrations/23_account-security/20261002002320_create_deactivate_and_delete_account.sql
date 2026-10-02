-- Module: account security — deactivate and delete your own account
--
-- Deactivate: sets profiles.deactivated_at. Teammates see you as "Deactivated" and
-- the app signs you out; signing in again offers to reactivate. Nothing is deleted.
--
-- Delete (irreversible, CLAUDE.md §18): removes the auth user. Rules:
--   * you can't delete while you are the protected creator of a workspace that
--     still has other members — remove them first (ownership transfer comes later)
--   * workspaces you created and are the only member of are deleted with you
--     (their boards, tasks, comments, events, clients, rules, links, invites go
--     with them through the existing ON DELETE CASCADE foreign keys)
--   * in other workspaces your membership is removed; your comments and history
--     stay, authored by "former member"
--   * files in Storage for deleted workspaces are NOT removed by this function
--     (Supabase does not allow deleting storage objects from SQL) — known limitation
--   * an audit event is written to every workspace you leave

alter table public.profiles add column if not exists deactivated_at timestamptz;
grant select (deactivated_at) on public.profiles to authenticated;

create or replace function public.set_my_account_active(active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  update public.profiles set deactivated_at = case when active then null else now() end where id = auth.uid();
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  w record;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.workspaces ws
    where ws.created_by = uid
      and exists (select 1 from public.workspace_members m where m.workspace_id = ws.id and m.user_id <> uid)
  ) then
    raise exception 'Remove the other members of the workspaces you created first' using errcode = 'P0001';
  end if;

  -- Audit event in every shared workspace being left
  for w in select m.workspace_id from public.workspace_members m
           join public.workspaces ws on ws.id = m.workspace_id
           where m.user_id = uid and ws.created_by is distinct from uid loop
    insert into public.task_events (workspace_id, actor_id, type, message)
    values (w.workspace_id, null, 'member.deleted', 'A member deleted their account');
  end loop;

  delete from public.workspaces ws where ws.created_by = uid;
  delete from public.workspace_members m where m.user_id = uid;

  -- Deleting the auth user sets tasks.assignee_id / comments.author_id / … to null
  -- through ON DELETE SET NULL. Those FK updates fire the task permission trigger,
  -- which would check the (now removed) membership and refuse. The trigger skips
  -- its checks for server-side work (auth.uid() is null), so the caller's claims
  -- are cleared for the rest of THIS transaction only (is_local = true).
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  delete from auth.users u where u.id = uid;
end;
$$;

revoke execute on function public.set_my_account_active(boolean) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.set_my_account_active(boolean) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Rollback:
-- drop function if exists public.delete_my_account();
-- drop function if exists public.set_my_account_active(boolean);
-- alter table public.profiles drop column if exists deactivated_at;
