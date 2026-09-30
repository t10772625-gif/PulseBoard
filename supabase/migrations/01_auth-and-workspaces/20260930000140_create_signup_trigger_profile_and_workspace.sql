-- Module: auth & workspaces
-- On sign-up: create the profile, a personal workspace, and make the user its Owner.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare ws uuid;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  insert into public.workspaces (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)) || ' workspace')
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'Owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
