-- Module: workspace invites (pre-approved emails)
-- Replaces the sign-up trigger function (same trigger, same signature).
-- If the new user's email has an open, unexpired invite, they join that
-- workspace with the invited role and no personal workspace is created.
-- Otherwise behaviour is unchanged: a personal workspace with them as Owner.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid;
  inv public.workspace_invites%rowtype;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);

  select * into inv
  from public.workspace_invites
  where email = lower(new.email)
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if found then
    insert into public.workspace_members (workspace_id, user_id, role) values (inv.workspace_id, new.id, inv.role);
    update public.workspace_invites set accepted_at = now(), accepted_by = new.id where id = inv.id;
    insert into public.task_events (workspace_id, actor_id, type, message)
    values (inv.workspace_id, new.id, 'member.joined', 'Joined as ' || inv.role || ' from a pre-approved email');
    return new;
  end if;

  insert into public.workspaces (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)) || ' workspace')
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'Owner');
  return new;
end;
$$;
