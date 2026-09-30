-- Module: projects (boards)
-- Members read; Owner/Admin create, edit and delete projects.
alter table public.projects enable row level security;

create policy "projects: read" on public.projects for select using (public.is_member(workspace_id));
create policy "projects: admins write" on public.projects for all
  using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
