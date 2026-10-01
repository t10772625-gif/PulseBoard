-- Module: security hardening
-- Trigger functions are only meant to run as triggers. Postgres checks EXECUTE
-- when a trigger is created, not when it fires, so revoking it from API roles
-- removes them from /rest/v1/rpc/... without changing what the triggers do.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_project_limit() from public, anon, authenticated;
revoke execute on function public.enforce_storage_quota() from public, anon, authenticated;
revoke execute on function public.check_task_update_permissions() from public, anon, authenticated;

-- Rollback:
-- grant execute on function public.handle_new_user() to public, anon, authenticated;
-- grant execute on function public.enforce_project_limit() to public, anon, authenticated;
-- grant execute on function public.enforce_storage_quota() to public, anon, authenticated;
-- grant execute on function public.check_task_update_permissions() to public, anon, authenticated;
