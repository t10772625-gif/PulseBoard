-- Module: clients & agency
alter table public.clients enable row level security;

create policy "clients: read" on public.clients for select using (public.is_member(workspace_id));
create policy "clients: admins write" on public.clients for all
  using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
