-- Module: auth & workspaces
-- Helpers used by every RLS policy. SECURITY DEFINER so a policy can check
-- membership without recursing into workspace_members' own policies.
create or replace function public.member_role_in(ws uuid)
returns public.member_role
language sql stable security definer set search_path = public
as $$
  select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()
$$;

create or replace function public.is_member(ws uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.member_role_in(ws) is not null $$;

-- Owner, Admin and Member can edit; Viewer is read-only
create or replace function public.can_edit(ws uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.member_role_in(ws) in ('Owner', 'Admin', 'Member') $$;

create or replace function public.is_admin(ws uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.member_role_in(ws) in ('Owner', 'Admin') $$;
