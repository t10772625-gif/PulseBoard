-- Module: test plan switch (until Stripe billing exists)
-- Lets the workspace OWNER change the plan from Settings → Plan & billing so paid
-- features can be tried before billing exists. No payment is taken.
--
-- Why SECURITY DEFINER (CLAUDE.md §5.4): signed-in users have no UPDATE grant on
-- workspaces.plan (15_api-grants) and that must stay true. This function is the
-- single, narrow exception. Threat model and checks:
--   * caller must be signed in                         (auth.uid() is not null)
--   * caller must be the Owner of that exact workspace (member_role_in)
--   * the server-wide switch must be ON                (app_settings.test_plan_switch)
--   * only the plan column changes; nothing else
--   * every change is written to the audit log (task_events, type 'plan.changed')
--   * fixed search_path; EXECUTE only for authenticated (not anon / PUBLIC)
-- Remove before production: turn the switch off (see 20261001001900) and drop this
-- function once Stripe webhooks set the plan.

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
  if public.member_role_in(ws) is distinct from 'Owner' then
    raise exception 'Only the workspace owner can change the plan' using errcode = '42501';
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

-- Rollback:
-- drop function public.test_set_plan(uuid, public.plan_tier);
