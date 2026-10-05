-- Module: granular permissions (Phase 2, user decisions 2026-10-05)
-- Every page and sub-page has its own permission, and create / edit / delete are
-- separate for every resource:
--   page.*                         sections + sub-pages (a sub-page needs its section too; app side)
--   task.create / edit / edit_all / move / assign / archive / delete / delete_all
--                                  edit, move and delete reach only your OWN tasks (created by you
--                                  or assigned to you) unless the role has edit_all / delete_all
--   comment.create / delete_all    (your own comments: always editable / deletable)
--   file.upload / delete / delete_all
--   share.create / revoke_all      (your own links: always revocable)
--   project.create / edit / delete      boards
--   column.create / edit / delete       board columns
--   client.create / edit / delete
--   member.invite / edit / remove
--   automation.create / edit / delete   rules
--   integration.connect / edit / disconnect
--   template.create / delete, field.create / delete, data.export
-- Must run after 21_simplify-roles (Admin = top role, always everything; no Owner)
-- and after batch F0 (adds the 'Client Viewer' enum value used below).
-- The lists below are generated from DEFAULT_PERMISSIONS in src/lib/permissions.ts:
--   node --experimental-strip-types scripts/permissions-sync-check.mts --print
-- and checked by the same script without --print.

-- 1. The matrix may store every new key (old CHECK allowed only page|task|comment|share|project|member|client|automation|data)
alter table public.role_permissions drop constraint if exists role_permissions_permission_check;
alter table public.role_permissions
  add constraint role_permissions_permission_check
  check (permission ~ '^(page|task|comment|file|share|project|column|member|client|automation|integration|template|field|data)\.[a-z_]+$');

-- 2. Defaults per role
create or replace function public.default_permission(r public.member_role, perm text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when r = 'Admin' then true
    when r = 'Sub Admin' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.analytics', 'page.clients', 'page.archive', 'page.ai', 'page.ai_create', 'page.ai_suggestions', 'page.ai_planning', 'page.ai_assign', 'page.ai_meetings', 'page.auto_rules', 'page.auto_webhooks', 'page.auto_notifications', 'page.auto_email_templates', 'page.auto_recurring', 'page.int_apps', 'page.int_slack', 'page.int_email', 'page.int_github', 'page.int_calendar', 'page.int_import', 'page.set_custom_fields', 'page.set_audit', 'task.create', 'task.edit', 'task.edit_all', 'task.move', 'task.assign', 'task.archive', 'task.delete', 'task.delete_all', 'comment.create', 'comment.delete_all', 'file.upload', 'file.delete', 'file.delete_all', 'share.create', 'share.revoke_all', 'project.create', 'project.edit', 'project.delete', 'column.create', 'column.edit', 'column.delete', 'client.create', 'client.edit', 'client.delete', 'template.create', 'template.delete', 'field.create', 'field.delete', 'data.export')
    -- Member: edits and moves their own tasks; deleting tasks is off until an Admin turns it on
    when r = 'Member' then perm in ('page.dashboard', 'page.projects', 'page.day', 'page.inbox', 'page.team', 'page.analytics', 'page.archive', 'page.ai', 'page.ai_create', 'page.ai_suggestions', 'page.ai_planning', 'page.ai_assign', 'page.ai_meetings', 'page.auto_rules', 'page.auto_webhooks', 'page.auto_notifications', 'page.auto_email_templates', 'page.auto_recurring', 'page.int_apps', 'page.int_slack', 'page.int_email', 'page.int_github', 'page.int_calendar', 'page.int_import', 'page.set_custom_fields', 'page.set_audit', 'task.create', 'task.edit', 'task.move', 'task.assign', 'task.archive', 'comment.create', 'file.upload', 'file.delete', 'share.create', 'template.create')
    -- Client Viewer (needs batch F0): nothing until per-board access exists (Phase 3);
    -- its own default, not Viewer's (user decision 2026-10-05)
    when r = 'Client Viewer' then false
    -- Viewer: pages only (has_permission also refuses every action for Viewer)
    else perm in ('page.dashboard', 'page.projects', 'page.inbox', 'page.team', 'page.ai_create', 'page.ai_suggestions', 'page.ai_planning', 'page.ai_assign', 'page.ai_meetings', 'page.auto_rules', 'page.auto_webhooks', 'page.auto_notifications', 'page.auto_email_templates', 'page.auto_recurring', 'page.int_apps', 'page.int_slack', 'page.int_email', 'page.int_github', 'page.int_calendar', 'page.int_import', 'page.set_custom_fields', 'page.set_audit')
  end
$$;

-- 3. has_permission: same rules as 21_simplify-roles, plus aliases so a policy or
--    function still written with an old key (e.g. 25_integrations' automation.manage)
--    follows the matching new switch instead of silently failing.
create or replace function public.has_permission(ws uuid, perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.member_role;
begin
  perm := case perm
    when 'project.manage' then 'project.edit'
    when 'client.manage' then 'client.edit'
    when 'member.manage' then 'member.edit'
    when 'automation.manage' then 'automation.edit'
    else perm
  end;
  r := public.member_role_in(ws);
  if r is null then return false; end if;
  -- Admin always has everything; the matrix can't take it away
  if r = 'Admin' then return true; end if;
  -- Client Viewer gets nothing until per-board access exists (Phase 3), whatever the matrix says
  if r = 'Client Viewer' then return false; end if;
  -- Viewer never gets an action, whatever the matrix says
  if r = 'Viewer' and perm not like 'page.%' then return false; end if;
  return coalesce(
    (select rp.allowed from public.role_permissions rp where rp.workspace_id = ws and rp.role = r and rp.permission = perm),
    public.default_permission(r, perm)
  );
end;
$$;

-- 4. Saved matrix rows for the old combined keys become the matching new keys
--    (live DB 2026-10-05: one row, Member member.manage = false)
insert into public.role_permissions (workspace_id, role, permission, allowed)
select rp.workspace_id, rp.role, n.permission, rp.allowed
from public.role_permissions rp
join (values
  ('project.manage', 'project.create'), ('project.manage', 'project.edit'), ('project.manage', 'project.delete'),
  ('project.manage', 'column.create'), ('project.manage', 'column.edit'), ('project.manage', 'column.delete'),
  ('client.manage', 'client.create'), ('client.manage', 'client.edit'), ('client.manage', 'client.delete'),
  ('member.manage', 'member.invite'), ('member.manage', 'member.edit'), ('member.manage', 'member.remove'),
  ('automation.manage', 'automation.create'), ('automation.manage', 'automation.edit'), ('automation.manage', 'automation.delete'),
  ('automation.manage', 'integration.connect'), ('automation.manage', 'integration.edit'), ('automation.manage', 'integration.disconnect')
) as n(old, permission) on n.old = rp.permission
on conflict (workspace_id, role, permission) do nothing;
delete from public.role_permissions where permission in ('project.manage', 'client.manage', 'member.manage', 'automation.manage');

-- Rollback: re-run default_permission and has_permission from
-- 21_simplify-roles/20261002002120_update_role_helper_functions.sql, then
-- alter table public.role_permissions drop constraint if exists role_permissions_permission_check;
-- alter table public.role_permissions add constraint role_permissions_permission_check
--   check (permission ~ '^(page|task|comment|share|project|member|client|automation|data)\.[a-z_]+$');
-- (rows for the new keys must be deleted first; the converted old rows are not restored)
