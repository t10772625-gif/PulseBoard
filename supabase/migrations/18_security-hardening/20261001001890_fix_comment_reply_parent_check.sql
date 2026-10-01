-- Module: security hardening
-- Fixes a bug in 20261001001860_protect_comment_authorship.sql. In the
-- "comments: create" policy the reply check was written as
--   select 1 from public.comments pc where pc.id = parent_id ...
-- Inside that sub-query the unqualified `parent_id` resolves to pc.parent_id
-- (the inner table), not the new row, so Postgres stored `pc.id = pc.parent_id`.
-- That is never true, so every reply (comment with a parent) was rejected.
-- Top-level comments were not affected. Same rules as 1860, with the new row's
-- columns referenced explicitly as comments.<column>.

drop policy if exists "comments: create" on public.comments;
create policy "comments: create" on public.comments for insert
  with check (
    public.has_permission(workspace_id, 'comment.create')
    and author_id = auth.uid()
    and exists (select 1 from public.tasks t where t.id = comments.task_id and t.workspace_id = comments.workspace_id)
    and (comments.parent_id is null or exists (
      select 1 from public.comments pc
      where pc.id = comments.parent_id and pc.task_id = comments.task_id and pc.workspace_id = comments.workspace_id))
  );

-- Rollback: re-run the "comments: create" part of 20261001001860_protect_comment_authorship.sql
-- (note: that version rejects all replies).
