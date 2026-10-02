-- Module: simplified roles + fuller sign-up form
-- Must run in the same session as …2110: after that file, a new sign-up that still
-- inserted role 'Owner' would fail the new CHECK constraint.
--
-- Sign-up now asks for more than name / email / password. The extra answers are
-- sent as auth user metadata (raw_user_meta_data) and copied here, cleaned:
--   workspace_name  → workspaces.name for a brand-new workspace (ignored when the
--                     email was invited to an existing workspace)
--   job_title       → profiles.job_title   (free text, max 80)
--   team_size       → profiles.team_size   (one of the listed values, else null)
--   use_case        → profiles.use_case    (one of the listed values, else null)
-- Metadata is user-controlled input: lengths are capped and lists are allow-lists.

alter table public.profiles
  add column if not exists job_title text check (char_length(job_title) <= 80),
  add column if not exists team_size text check (team_size in ('1', '2-10', '11-50', '51-200', '200+')),
  add column if not exists use_case text check (use_case in ('software', 'agency', 'marketing', 'operations', 'personal', 'other'));

-- Teammates may read them (existing SELECT policy limits rows); users edit their own
-- (same column-level grant style as full_name)
grant select (job_title, team_size, use_case) on public.profiles to authenticated;
grant update (job_title, team_size, use_case) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid;
  inv public.workspace_invites%rowtype;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := left(btrim(coalesce(meta ->> 'full_name', '')), 120);
  ws_name text := left(btrim(coalesce(meta ->> 'workspace_name', '')), 80);
  team text := meta ->> 'team_size';
  use_case text := meta ->> 'use_case';
begin
  insert into public.profiles (id, full_name, email, job_title, team_size, use_case)
  values (
    new.id,
    full_name,
    new.email,
    nullif(left(btrim(coalesce(meta ->> 'job_title', '')), 80), ''),
    case when team in ('1', '2-10', '11-50', '51-200', '200+') then team end,
    case when use_case in ('software', 'agency', 'marketing', 'operations', 'personal', 'other') then use_case end
  );

  select * into inv
  from public.workspace_invites
  where email = lower(new.email)
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if found then
    insert into public.workspace_members (workspace_id, user_id, role) values (inv.workspace_id, new.id, inv.role);
    update public.workspace_invites set accepted_at = now(), accepted_by = new.id where id = inv.id;
    insert into public.task_events (workspace_id, actor_id, type, message)
    values (inv.workspace_id, new.id, 'member.joined', 'Joined as ' || inv.role || ' from a pre-approved email');
    return new;
  end if;

  insert into public.workspaces (name, created_by)
  values (
    coalesce(nullif(ws_name, ''), coalesce(nullif(full_name, ''), split_part(new.email, '@', 1)) || ' workspace'),
    new.id
  )
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'Admin');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Rollback: re-run 16_workspace-invites/20260930001620_join_invited_workspace_on_signup.sql
-- (only after rolling back …2110, because it inserts 'Owner'), then
-- alter table public.profiles drop column if exists job_title, drop column if exists team_size, drop column if exists use_case;
