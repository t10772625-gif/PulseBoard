-- Module: granular permissions (Phase 2, user decisions 2026-10-05)
-- Comments, files and share links get their own delete / upload / revoke switches.
--   comments delete:      your own always; anyone's needs comment.delete_all (was: Admin only)
--   attachments insert:   file.upload (was task.edit)
--   attachments delete:   your own upload needs file.delete; anyone's needs file.delete_all (was: own or Admin)
--   task-files bucket:    upload needs file.upload (+ quota, unchanged); deleting an object needs
--                         file.delete for your own object or file.delete_all
--                         (closes FA-05: any editor could delete anyone's files in the bucket)
--   share_links revoke:   your own always; anyone's needs share.revoke_all (was: Admin)
-- Comment create / edit / likes and share-link create are unchanged (18_security-hardening).
-- Every new-row column is written as <table>.<column> (lesson from F-2026-10-01-14).

drop policy if exists "comments: author deletes" on public.comments;
create policy "comments: author deletes" on public.comments
  for delete to authenticated
  using (comments.author_id = auth.uid() or public.has_permission(comments.workspace_id, 'comment.delete_all'));

drop policy if exists "attachments: add" on public.attachments;
create policy "attachments: add" on public.attachments
  for insert to authenticated
  with check (
    public.has_permission(attachments.workspace_id, 'file.upload')
    and attachments.uploaded_by = auth.uid()
    and exists (select 1 from public.tasks t where t.id = attachments.task_id and t.workspace_id = attachments.workspace_id)
    and split_part(attachments.storage_path, '/', 1) = attachments.workspace_id::text
  );

drop policy if exists "attachments: remove" on public.attachments;
create policy "attachments: remove" on public.attachments
  for delete to authenticated
  using (
    (attachments.uploaded_by = auth.uid() and public.has_permission(attachments.workspace_id, 'file.delete'))
    or public.has_permission(attachments.workspace_id, 'file.delete_all')
  );

drop policy if exists "task-files: editors upload" on storage.objects;
create policy "task-files: editors upload" on storage.objects
  for insert to authenticated
  with check (
    objects.bucket_id = 'task-files'
    and public.has_permission(((storage.foldername(objects.name))[1])::uuid, 'file.upload')
    and public.storage_used_bytes(((storage.foldername(objects.name))[1])::uuid) < public.storage_limit_bytes(((storage.foldername(objects.name))[1])::uuid)
  );

drop policy if exists "task-files: editors delete" on storage.objects;
create policy "task-files: editors delete" on storage.objects
  for delete to authenticated
  using (
    objects.bucket_id = 'task-files'
    and (
      (objects.owner_id = auth.uid()::text and public.has_permission(((storage.foldername(objects.name))[1])::uuid, 'file.delete'))
      or public.has_permission(((storage.foldername(objects.name))[1])::uuid, 'file.delete_all')
    )
  );

drop policy if exists "share_links: revoke" on public.share_links;
create policy "share_links: revoke" on public.share_links
  for update to authenticated
  using (share_links.created_by = auth.uid() or public.has_permission(share_links.workspace_id, 'share.revoke_all'))
  with check (
    share_links.revoked_at is not null
    and (share_links.created_by = auth.uid() or public.has_permission(share_links.workspace_id, 'share.revoke_all'))
  );

-- Rollback: recreate the previous policies (definitions as of 2026-10-05):
-- comments "comments: author deletes":   using ((author_id = auth.uid()) or is_admin(workspace_id))
-- attachments "attachments: add":        has_permission(workspace_id, 'task.edit') and uploaded_by = auth.uid() and task in same workspace
--                                        and split_part(storage_path, '/', 1) = workspace_id::text
-- attachments "attachments: remove":     using ((uploaded_by = auth.uid()) or is_admin(workspace_id))
-- storage "task-files: editors upload":  bucket 'task-files' and can_edit(folder ws) and storage_used_bytes(ws) < storage_limit_bytes(ws)
-- storage "task-files: editors delete":  bucket 'task-files' and can_edit(folder ws)
-- share_links "share_links: revoke":     using (is_admin(workspace_id) or created_by = auth.uid())
--                                        with check (revoked_at is not null and (is_admin(workspace_id) or created_by = auth.uid()))
