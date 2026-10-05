-- Module: simplified roles (REVISED 2026-10-05 per user design; replaces the six
-- 2026-10-02 files of this folder, which were never applied):
--   * Roles: Admin / Sub Admin / Member / Viewer. No Owner, no separate "creator".
--   * Admin = owner = buyer of the workspace. EXACTLY ONE Admin per workspace.
--   * The Admin row can't be changed or removed by anyone; nobody changes their own role.
--   * Plan / billing (test_set_plan now, Stripe later): Admin only.
--   * Everything else can be delegated by the Admin to other roles via the permission matrix.
-- Rollback: scratchpad batches/A_21_ROLLBACK.sql (restores the live definitions of 2026-10-05).

-- 1. Data: every Owner becomes the workspace's Admin -------------------------------
-- (live 2026-10-05: 3 workspaces, each with exactly 1 Owner and no other Admin)
update public.workspace_members set role = 'Admin' where role = 'Owner';
-- Invites can't hand out Admin any more (live 2026-10-05: 0 such invites)
update public.workspace_invites set role = 'Member' where role in ('Owner', 'Admin');
-- Admin always has everything; matrix rows for Owner / Admin mean nothing (live: none)
delete from public.role_permissions where role in ('Owner', 'Admin');

-- 2. Constraints ------------------------------------------------------------------
-- The enum value 'Owner' can't be dropped without rebuilding the type; it stays but is never used
alter table public.workspace_members drop constraint if exists workspace_members_no_owner_role;
alter table public.workspace_members add constraint workspace_members_no_owner_role check (role <> 'Owner');

alter table public.workspace_invites drop constraint if exists workspace_invites_no_owner_role;
alter table public.workspace_invites drop constraint if exists workspace_invites_no_admin_role;
alter table public.workspace_invites add constraint workspace_invites_no_admin_role check (role not in ('Owner', 'Admin'));

alter table public.role_permissions drop constraint if exists role_permissions_editable_roles;
alter table public.role_permissions add constraint role_permissions_editable_roles check (role not in ('Owner', 'Admin'));

-- Exactly one Admin per workspace: at most one by this index; at least one because the
-- sign-up trigger creates it and nobody can change or remove the Admin row (section 4)
create unique index if not exists workspace_members_one_admin
  on public.workspace_members (workspace_id) where role = 'Admin';

-- 3. Role helpers (same signatures and grants as before) ----------------------------
create or replace function public.is_admin(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.member_role_in(ws) = 'Admin' $$;

create or replace function public.can_edit(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.member_role_in(ws) in ('Admin', 'Sub Admin', 'Member') $$;

create or replace function public.default_permission(r public.member_role, perm text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when r = 'Admin' then true
    when r = 'Sub Admin' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.clients', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create', 'project.manage', 'client.manage', 'data.export')
    when r = 'Member' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.ai', 'page.analytics', 'page.archive', 'task.create', 'task.edit', 'task.assign', 'task.archive', 'task.delete', 'comment.create', 'share.create')
    else perm in ('page.dashboard', 'page.projects', 'page.inbox', 'page.team')
  end
$$;

-- The Admin has every permission. Every other role follows the matrix the Admin sets
-- (the Admin may switch on ANY permission for Sub Admin). Viewer never gets an action.
create or replace function public.has_permission(ws uuid, perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.member_role;
begin
  r := public.member_role_in(ws);
  if r is null then return false; end if;
  if r = 'Admin' then return true; end if;
  if r = 'Viewer' and perm not like 'page.%' then return false; end if;
  return coalesce(
    (select rp.allowed from public.role_permissions rp where rp.workspace_id = ws and rp.role = r and rp.permission = perm),
    public.default_permission(r, perm)
  );
end;
$$;

-- 4. Who manages roles and members --------------------------------------------------
-- Matrix: only the Admin edits it (rows for Sub Admin / Member / Viewer; Viewer: pages only)
drop policy if exists "role_permissions: manage" on public.role_permissions;
create policy "role_permissions: manage" on public.role_permissions
  for all to authenticated
  using (
    public.is_admin(role_permissions.workspace_id)
    and role_permissions.role in ('Sub Admin', 'Member', 'Viewer')
  )
  with check (
    public.is_admin(role_permissions.workspace_id)
    and role_permissions.role in ('Sub Admin', 'Member', 'Viewer')
    and (role_permissions.role <> 'Viewer' or role_permissions.permission like 'page.%' or role_permissions.allowed = false)
  );

-- Invites: anyone the Admin allows (member.manage); never for the Admin role (CHECK above)
drop policy if exists "invites: managers create" on public.workspace_invites;
create policy "invites: managers create" on public.workspace_invites
  for insert to authenticated
  with check (
    public.has_permission(workspace_invites.workspace_id, 'member.manage')
    and workspace_invites.invited_by = auth.uid()
    and workspace_invites.role <> 'Admin'
    and workspace_invites.accepted_at is null
    and workspace_invites.accepted_by is null
    and workspace_invites.revoked_at is null
  );

-- Role changes: never the Admin row, never to Admin (so the Admin can't be demoted and
-- no second Admin can be made). Anyone the Admin allows (member.manage) changes the rest.
drop policy if exists "members: change" on public.workspace_members;
create policy "members: change" on public.workspace_members
  for update to authenticated
  using (
    public.has_permission(workspace_members.workspace_id, 'member.manage')
    and workspace_members.role <> 'Admin'
  )
  with check (
    public.has_permission(workspace_members.workspace_id, 'member.manage')
    and workspace_members.role <> 'Admin'
  );

-- Removing people: never the Admin
drop policy if exists "members: remove" on public.workspace_members;
create policy "members: remove" on public.workspace_members
  for delete to authenticated
  using (
    public.has_permission(workspace_members.workspace_id, 'member.manage')
    and workspace_members.role <> 'Admin'
  );

-- Workspace name: the Admin; the plan can never change through this policy
drop policy if exists "workspaces: owner renames" on public.workspaces;
drop policy if exists "workspaces: admins rename" on public.workspaces;
create policy "workspaces: admins rename" on public.workspaces
  for update to authenticated
  using (public.is_admin(workspaces.id))
  with check (
    public.is_admin(workspaces.id)
    and workspaces.plan = (select w.plan from public.workspaces w where w.id = workspaces.id)
  );

-- Nobody changes their own role (CLAUDE.md §4). A policy can't tell a role change from a
-- capacity change on the same row, so a trigger checks it; your own capacity stays editable.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and old.user_id = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists workspace_members_no_self_role on public.workspace_members;
create trigger workspace_members_no_self_role
  before update on public.workspace_members
  for each row execute function public.prevent_self_role_change();
revoke execute on function public.prevent_self_role_change() from public, anon, authenticated;

-- 5. Plan / billing: the Admin only (temporary test switch from 19; Stripe later) ------
-- Only the role check changes ('Owner' → 'Admin'); the switch itself is unchanged.
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
  if public.member_role_in(ws) is distinct from 'Admin' then
    raise exception 'Only the workspace Admin can change the plan' using errcode = '42501';
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

-- 6. Sign-up: fuller form; a new workspace's first user is its Admin -----------------
-- Metadata is user-controlled input: lengths are capped and lists are allow-lists.
alter table public.profiles
  add column if not exists job_title text check (char_length(job_title) <= 80),
  add column if not exists team_size text check (team_size in ('1', '2-10', '11-50', '51-200', '200+')),
  add column if not exists use_case text check (use_case in ('software', 'agency', 'marketing', 'operations', 'personal', 'other'));
grant select (job_title, team_size, use_case) on public.profiles to authenticated;
grant update (job_title, team_size, use_case) on public.profiles to authenticated;

-- The invite branch is unchanged from the live function (same query, same inserts).
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

  insert into public.workspaces (name)
  values (coalesce(nullif(ws_name, ''), coalesce(nullif(full_name, ''), split_part(new.email, '@', 1)) || ' workspace'))
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'Admin');
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
