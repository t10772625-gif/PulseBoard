-- Module: security hardening
-- "members: add" let anyone with member.manage insert ANY user id into their
-- workspace without that user's consent. Every user owns their own workspace,
-- so anyone could add a stranger (by UUID) and then read the stranger's email
-- and name through "profiles: read self and teammates".
--
-- The app never inserts into workspace_members directly: people join through
-- workspace_invites, and handle_new_user() (SECURITY DEFINER, runs as the table
-- owner) adds the membership. So direct inserts from the API are removed.
-- Role changes and removals ("members: change" / "members: remove") are unchanged.

drop policy if exists "members: add" on public.workspace_members;
revoke insert on public.workspace_members from authenticated;

-- Rollback:
-- grant insert on public.workspace_members to authenticated;
-- create policy "members: add" on public.workspace_members for insert
--   with check (public.has_permission(workspace_id, 'member.manage')
--     and (role not in ('Owner', 'Admin') or public.member_role_in(workspace_id) = 'Owner'));
