-- Module: simplified roles
-- Every Owner becomes an Admin (their creator protection comes from
-- workspaces.created_by, added in …2100). The enum value 'Owner' can't be dropped
-- without rebuilding the type, so it stays in public.member_role but CHECK
-- constraints stop any row from using it again.

update public.workspace_members set role = 'Admin' where role = 'Owner';
update public.workspace_invites set role = 'Admin' where role = 'Owner';

-- Admin now always has full access, so stored matrix rows for Owner / Admin mean nothing
delete from public.role_permissions where role in ('Owner', 'Admin');

alter table public.workspace_members
  add constraint workspace_members_no_owner_role check (role <> 'Owner');
alter table public.workspace_invites
  add constraint workspace_invites_no_owner_role check (role <> 'Owner');
alter table public.role_permissions
  add constraint role_permissions_editable_roles check (role not in ('Owner', 'Admin'));

-- Rollback (restores the Owner role for each workspace creator):
-- alter table public.role_permissions drop constraint if exists role_permissions_editable_roles;
-- alter table public.workspace_invites drop constraint if exists workspace_invites_no_owner_role;
-- alter table public.workspace_members drop constraint if exists workspace_members_no_owner_role;
-- update public.workspace_members m set role = 'Owner'
--   from public.workspaces w where w.id = m.workspace_id and w.created_by = m.user_id;
