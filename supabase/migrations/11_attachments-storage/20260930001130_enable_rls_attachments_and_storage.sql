-- Module: attachments & storage
-- Table: members read, editors add, uploader or admin removes.
-- Bucket objects: the first path segment is the workspace id, checked against membership.
alter table public.attachments enable row level security;

create policy "attachments: read" on public.attachments for select using (public.is_member(workspace_id));
create policy "attachments: editors add" on public.attachments for insert
  with check (public.can_edit(workspace_id) and uploaded_by = auth.uid());
create policy "attachments: remove" on public.attachments for delete
  using (uploaded_by = auth.uid() or public.is_admin(workspace_id));

create policy "task-files: members read" on storage.objects for select
  using (bucket_id = 'task-files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "task-files: editors upload" on storage.objects for insert
  with check (
    bucket_id = 'task-files'
    and public.can_edit(((storage.foldername(name))[1])::uuid)
    and public.storage_used_bytes(((storage.foldername(name))[1])::uuid) < public.storage_limit_bytes(((storage.foldername(name))[1])::uuid)
  );
create policy "task-files: editors delete" on storage.objects for delete
  using (bucket_id = 'task-files' and public.can_edit(((storage.foldername(name))[1])::uuid));
