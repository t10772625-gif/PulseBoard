-- Module: simplified roles
-- The temporary test plan switch (19_test-plan-switch) was Owner-only. Billing now
-- belongs to the protected workspace creator. Everything else is unchanged.

create or replace function public.test_set_plan(ws uuid, new_plan public.plan_tier)
returns public.plan_tier
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old_plan public.plan_tier;
  enabled boolean;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not public.is_creator(ws) or public.member_role_in(ws) is distinct from 'Admin' then
    raise exception 'Only the workspace creator can change the plan' using errcode = '42501';
  end if;
  select coalesce((value)::text = 'true', false) into enabled from public.app_settings where key = 'test_plan_switch';
  if not coalesce(enabled, false) then
    raise exception 'Plan switching is turned off' using errcode = '42501';
  end if;

  select plan into old_plan from public.workspaces where id = ws for update;
  if old_plan is null then
    raise exception 'Workspace not found' using errcode = '42501';
  end if;
  if old_plan = new_plan then
    return new_plan;
  end if;

  update public.workspaces set plan = new_plan where id = ws;
  insert into public.task_events (workspace_id, actor_id, type, message)
  values (ws, uid, 'plan.changed', 'Plan changed from ' || old_plan || ' to ' || new_plan || ' (test switch, no payment)');
  return new_plan;
end;
$$;

revoke execute on function public.test_set_plan(uuid, public.plan_tier) from public, anon;
grant execute on function public.test_set_plan(uuid, public.plan_tier) to authenticated;

-- Rollback: re-run 19_test-plan-switch/20261001001910_create_test_set_plan_function.sql
