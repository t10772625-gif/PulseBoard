-- Module: role permissions (RBAC)
drop policy if exists "share_links: editors create" on public.share_links;

create policy "share_links: create" on public.share_links for insert
  with check (public.has_permission(workspace_id, 'share.create') and created_by = auth.uid());
