-- Module: role permissions (RBAC)
drop policy if exists "comments: editors insert" on public.comments;

create policy "comments: create" on public.comments for insert
  with check (public.has_permission(workspace_id, 'comment.create') and author_id = auth.uid());
