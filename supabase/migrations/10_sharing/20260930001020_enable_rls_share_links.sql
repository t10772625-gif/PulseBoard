-- Module: sharing
-- Members see their workspace's links; editors create them; admins or the creator revoke.
alter table public.share_links enable row level security;

create policy "share_links: read" on public.share_links for select using (public.is_member(workspace_id));
create policy "share_links: editors create" on public.share_links for insert
  with check (public.can_edit(workspace_id) and created_by = auth.uid());
create policy "share_links: revoke" on public.share_links for update
  using (public.is_admin(workspace_id) or created_by = auth.uid()) with check (public.is_member(workspace_id));
