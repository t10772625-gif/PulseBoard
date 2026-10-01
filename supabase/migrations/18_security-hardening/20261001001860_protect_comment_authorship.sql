-- Module: security hardening
-- Before: any editor could UPDATE any comment's body, author_id, task_id or
-- workspace_id (forging or rewriting other people's comments), and a comment
-- could be inserted on a task from another workspace.
--
-- After:
--   * Only body and liked_by can be updated (column grants).
--   * Only the author can change the body.
--   * A like/unlike may only add or remove the caller's own id in liked_by.
--   * New comments must be on a task in the same workspace, and a reply's
--     parent must be on that same task.
-- The app only updates liked_by (likes) today, so nothing it does changes.

-- Column lock
revoke update on public.comments from authenticated;
grant update (body, liked_by) on public.comments to authenticated;

-- Body = author only; likes = only your own id
create or replace function public.check_comment_update()
returns trigger language plpgsql set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then return new; end if; -- server roles

  if new.body is distinct from old.body and old.author_id is distinct from me then
    raise exception 'Only the author can edit this comment';
  end if;

  if (select coalesce(array_agg(distinct x order by x), '{}') from unnest(new.liked_by) x where x <> me)
     is distinct from
     (select coalesce(array_agg(distinct x order by x), '{}') from unnest(old.liked_by) x where x <> me) then
    raise exception 'You can only add or remove your own like';
  end if;

  return new;
end;
$$;
revoke execute on function public.check_comment_update() from public, anon, authenticated;

drop trigger if exists comments_update_check on public.comments;
create trigger comments_update_check
  before update on public.comments
  for each row execute function public.check_comment_update();

-- Create: task (and parent comment) must be in the same workspace
drop policy if exists "comments: create" on public.comments;
create policy "comments: create" on public.comments for insert
  with check (
    public.has_permission(workspace_id, 'comment.create')
    and author_id = auth.uid()
    and exists (select 1 from public.tasks t where t.id = task_id and t.workspace_id = comments.workspace_id)
    and (parent_id is null or exists (
      select 1 from public.comments pc
      where pc.id = parent_id and pc.task_id = comments.task_id and pc.workspace_id = comments.workspace_id))
  );

-- Rollback:
-- drop trigger comments_update_check on public.comments;
-- drop function public.check_comment_update();
-- grant update on public.comments to authenticated;
-- drop policy "comments: create" on public.comments;
-- create policy "comments: create" on public.comments for insert
--   with check (public.has_permission(workspace_id, 'comment.create') and author_id = auth.uid());
