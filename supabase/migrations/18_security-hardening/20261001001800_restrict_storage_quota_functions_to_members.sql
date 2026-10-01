-- Module: security hardening
-- storage_used_bytes / storage_limit_bytes are callable over RPC
-- (/rest/v1/rpc/...). They are SECURITY DEFINER, so before this change any
-- signed-in user could pass another workspace's id and read its storage usage
-- and plan. Now a signed-in caller only gets values for workspaces they belong
-- to; anyone else gets null.
--
-- auth.uid() is null only for server roles (service_role / postgres) — anon
-- loses EXECUTE in ..._revoke_anon_execute_on_rls_helpers.sql — so the quota
-- trigger keeps working for server-side inserts too.
--
-- Same signatures as 11_attachments-storage, so existing grants, the storage
-- upload policy and the attachments quota trigger keep working unchanged.

create or replace function public.storage_limit_bytes(ws uuid)
returns bigint language sql stable security definer set search_path = public
as $$
  select case plan when 'free' then 1::bigint when 'pro' then 5::bigint else 10::bigint end * 1024 * 1024 * 1024
  from public.workspaces
  where id = ws and (auth.uid() is null or public.is_member(ws))
$$;

create or replace function public.storage_used_bytes(ws uuid)
returns bigint language sql stable security definer set search_path = public
as $$
  select case when auth.uid() is null or public.is_member(ws)
    then (select coalesce(sum(size_bytes), 0)::bigint from public.attachments where workspace_id = ws)
  end
$$;

-- Rollback: re-run 11_attachments-storage/20260930001120_create_storage_quota_functions.sql
-- (only its two `create or replace function public.storage_*` statements).
