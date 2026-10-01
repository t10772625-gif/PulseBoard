-- Module: plan tiers
-- Plans are renamed on the user's decision (2026-10-01):
--   free      -> basic       ($0, same limits)
--   pro       -> pro         (unchanged, $12/user/mo)
--   legendary -> enterprise  ($18/user/mo, same features)
--
-- RENAME VALUE changes the enum label in place: every workspaces.plan row keeps
-- its tier, no data is copied or rewritten. Column defaults and RLS policies
-- point to the enum value itself, so they follow the rename automatically.
--
-- Two functions compare plan against the old labels as text and must be
-- recreated in the same run, otherwise:
--   storage_limit_bytes   -> errors on 'free' (invalid enum input), blocking uploads
--   enforce_project_limit -> errors on 'free', blocking new projects
-- Bodies are identical to 18_security-hardening / 02_projects apart from the labels.
--
-- The app must be on the matching code (Plan = "basic" | "pro" | "enterprise").
-- The app also reads the old labels (free / legendary) safely, so the order of
-- deploying code and running this file does not matter.

alter type public.plan_tier rename value 'free' to 'basic';
alter type public.plan_tier rename value 'legendary' to 'enterprise';

alter table public.workspaces alter column plan set default 'basic';

create or replace function public.storage_limit_bytes(ws uuid)
returns bigint language sql stable security definer set search_path = public
as $$
  select case plan when 'basic' then 1::bigint when 'pro' then 5::bigint else 10::bigint end * 1024 * 1024 * 1024
  from public.workspaces
  where id = ws and (auth.uid() is null or public.is_member(ws))
$$;

create or replace function public.enforce_project_limit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (select plan from public.workspaces where id = new.workspace_id) = 'basic'
     and (select count(*) from public.projects where workspace_id = new.workspace_id) >= 1 then
    raise exception 'The Basic plan allows 1 project. Upgrade to Pro for unlimited projects.';
  end if;
  return new;
end;
$$;

-- CREATE OR REPLACE keeps the existing grants (storage_limit_bytes: authenticated,
-- service_role; enforce_project_limit: no API access) and the trigger binding.

-- Rollback (revert the app code first):
--   alter type public.plan_tier rename value 'basic' to 'free';
--   alter type public.plan_tier rename value 'enterprise' to 'legendary';
--   alter table public.workspaces alter column plan set default 'free';
--   then re-run the two functions from 18_security-hardening/…1800 (storage_limit_bytes)
--   and 02_projects/…0210 (enforce_project_limit, the `create or replace function` only).
