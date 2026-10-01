-- Module: security hardening
-- Share links could point at another workspace's task or board: neither the
-- INSERT policy nor get_shared() checked that target_id belongs to the link's
-- workspace, and creators could UPDATE target_id afterwards. Anyone with the
-- token (no sign-in) could then read that other workspace's task / board.
--
-- Fix, in three layers:
--   1. INSERT policy: the target must be a task / board in the same workspace.
--   2. UPDATE: only revoked_at can change, and a revoked link stays revoked.
--   3. get_shared(): only returns a target that is in the link's workspace,
--      so even an old or hand-made bad row returns nothing.

-- 1. Create: target must belong to the same workspace
drop policy if exists "share_links: create" on public.share_links;
create policy "share_links: create" on public.share_links for insert
  with check (
    public.has_permission(workspace_id, 'share.create')
    and created_by = auth.uid()
    and case kind
      when 'task' then exists (select 1 from public.tasks t where t.id = target_id and t.workspace_id = share_links.workspace_id)
      when 'board' then exists (select 1 from public.projects p where p.id = target_id and p.workspace_id = share_links.workspace_id)
      else false
    end
  );

-- 2. Revoke only: no other column can change, and a link can't be un-revoked
revoke update on public.share_links from authenticated;
grant update (revoked_at) on public.share_links to authenticated;

drop policy if exists "share_links: revoke" on public.share_links;
create policy "share_links: revoke" on public.share_links for update
  using (public.is_admin(workspace_id) or created_by = auth.uid())
  with check (revoked_at is not null and (public.is_admin(workspace_id) or created_by = auth.uid()));

-- 3. Public read: the target must be in the link's workspace
create or replace function public.get_shared(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare link public.share_links;
begin
  select * into link from public.share_links
  where token = p_token and revoked_at is null and (expires_at is null or expires_at > now());
  if not found then return null; end if;

  if link.kind = 'task' then
    return (select jsonb_build_object('kind', 'task', 'task',
      jsonb_build_object('title', t.title, 'status', t.status, 'due_date', t.due_date, 'description', t.description))
      from public.tasks t
      where t.id = link.target_id and t.workspace_id = link.workspace_id and t.deleted_at is null);
  end if;

  return (select jsonb_build_object(
      'kind', 'board',
      'project', jsonb_build_object('name', p.name, 'description', p.description),
      'tasks', coalesce((select jsonb_agg(jsonb_build_object('title', t.title, 'status', t.status, 'due_date', t.due_date) order by t.created_at)
                         from public.tasks t
                         where t.project_id = p.id and t.workspace_id = link.workspace_id
                           and t.deleted_at is null and t.archived_at is null), '[]'::jsonb))
    from public.projects p
    where p.id = link.target_id and p.workspace_id = link.workspace_id);
end;
$$;

-- Rollback:
-- drop policy "share_links: create" on public.share_links;
-- create policy "share_links: create" on public.share_links for insert
--   with check (public.has_permission(workspace_id, 'share.create') and created_by = auth.uid());
-- drop policy "share_links: revoke" on public.share_links;
-- create policy "share_links: revoke" on public.share_links for update
--   using (public.is_admin(workspace_id) or created_by = auth.uid()) with check (public.is_member(workspace_id));
-- grant update on public.share_links to authenticated;
-- get_shared(): re-run it from 10_sharing (without the workspace_id conditions).
