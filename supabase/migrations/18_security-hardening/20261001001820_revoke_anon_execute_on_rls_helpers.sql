-- Module: security hardening
-- RLS helper and quota functions are only useful to signed-in users: every
-- policy that calls them runs as `authenticated`, which keeps EXECUTE.
-- Signed-out visitors (`anon`) have no table grants, so they never need these.
-- Functions get EXECUTE for PUBLIC by default, so PUBLIC is revoked too.
--
-- Deliberately NOT changed: public.get_shared(text) stays callable by anon,
-- because public share links are designed to work without signing in.
-- New functions: Supabase grants EXECUTE to anon by default, so revoke it in
-- the migration that creates them unless they are meant to be public.

revoke execute on function public.member_role_in(uuid) from public, anon;
revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.can_edit(uuid) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
revoke execute on function public.has_permission(uuid, text) from public, anon;
revoke execute on function public.default_permission(public.member_role, text) from public, anon;
revoke execute on function public.storage_used_bytes(uuid) from public, anon;
revoke execute on function public.storage_limit_bytes(uuid) from public, anon;

grant execute on function public.member_role_in(uuid) to authenticated, service_role;
grant execute on function public.is_member(uuid) to authenticated, service_role;
grant execute on function public.can_edit(uuid) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.has_permission(uuid, text) to authenticated, service_role;
grant execute on function public.default_permission(public.member_role, text) to authenticated, service_role;
grant execute on function public.storage_used_bytes(uuid) to authenticated, service_role;
grant execute on function public.storage_limit_bytes(uuid) to authenticated, service_role;

-- Rollback:
-- grant execute on function public.member_role_in(uuid), public.is_member(uuid), public.can_edit(uuid),
--   public.is_admin(uuid), public.has_permission(uuid, text), public.default_permission(public.member_role, text),
--   public.storage_used_bytes(uuid), public.storage_limit_bytes(uuid) to public, anon;
