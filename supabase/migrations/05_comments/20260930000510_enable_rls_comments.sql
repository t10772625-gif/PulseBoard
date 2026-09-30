-- Module: comments
-- Members read; editors post as themselves; authors edit/delete their own, admins can delete any.
alter table public.comments enable row level security;

create policy "comments: read" on public.comments for select using (public.is_member(workspace_id));
create policy "comments: editors insert" on public.comments for insert
  with check (public.can_edit(workspace_id) and author_id = auth.uid());
create policy "comments: author updates" on public.comments for update
  using (author_id = auth.uid() or public.can_edit(workspace_id)) with check (public.is_member(workspace_id));
create policy "comments: author deletes" on public.comments for delete
  using (author_id = auth.uid() or public.is_admin(workspace_id));
