-- Module: role permissions (RBAC)
-- Roles without the Clients page can't read client data either (not just a hidden menu).
drop policy if exists "clients: read" on public.clients;
drop policy if exists "clients: admins write" on public.clients;

create policy "clients: read" on public.clients for select using (public.has_permission(workspace_id, 'page.clients'));
create policy "clients: manage" on public.clients for all
  using (public.has_permission(workspace_id, 'client.manage'))
  with check (public.has_permission(workspace_id, 'client.manage'));
