-- Module: granular permissions — Client Viewer (user decision 2026-10-05)
-- Requires batch F0 (alter type public.member_role add value 'Client Viewer').
--
-- Client Viewer is meant to see ONLY the boards explicitly shared with them. Per-board
-- access doesn't exist yet (Phase 3), and almost every read policy only asks
-- is_member(workspace). So until Phase 3 a Client Viewer is deliberately NOT treated as a
-- member: no pages, no actions, and no rows from any workspace table. Without this, a
-- Client Viewer could read every board, task and comment through the API.
-- has_permission / default_permission (…2610) already return false for Client Viewer;
-- can_edit (21) only accepts Admin / Sub Admin / Member.

create or replace function public.is_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select coalesce(public.member_role_in(ws) not in ('Client Viewer'), false) $$;

-- Same grants as before (18_security-hardening …1820)
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated, service_role;

-- Rollback (restores the live definition of 2026-10-05):
-- create or replace function public.is_member(ws uuid) returns boolean language sql stable security definer
--   set search_path = public as $$ select public.member_role_in(ws) is not null $$;
