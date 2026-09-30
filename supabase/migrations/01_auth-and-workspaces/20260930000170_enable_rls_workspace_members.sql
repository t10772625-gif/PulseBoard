-- Module: auth & workspaces
-- Members see the member list; Owner/Admin invite, change roles and remove people.
alter table public.workspace_members enable row level security;

create policy "members: read" on public.workspace_members for select using (public.is_member(workspace_id));
create policy "members: admins add" on public.workspace_members for insert with check (public.is_admin(workspace_id));
create policy "members: admins change" on public.workspace_members for update using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy "members: admins remove" on public.workspace_members for delete using (public.is_admin(workspace_id));
