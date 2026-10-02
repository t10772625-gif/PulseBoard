-- Module: account security — two-factor authentication is enforced by the database
-- Supabase Auth (TOTP authenticator apps, free on every plan) gives a session
-- aal1 after the password and aal2 after the 6-digit code. If a user has turned
-- on 2FA (a verified factor), an aal1 session must not reach workspace data —
-- otherwise someone with only the password could skip the code step by calling
-- the API directly.
--
-- member_role_in() is the base of every workspace policy helper (is_member,
-- can_edit, is_admin, has_permission), so checking here covers tasks, projects,
-- comments, files, clients, rules, members and settings at once. Users without
-- 2FA are unaffected. Not covered: profiles of teammates and the user's own
-- notifications (they don't go through member_role_in).

create or replace function public.member_role_in(ws uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.workspace_members m
  where m.workspace_id = ws
    and m.user_id = auth.uid()
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
    )
$$;

-- Same grants as before (18_security-hardening …1820)
revoke execute on function public.member_role_in(uuid) from public, anon;
grant execute on function public.member_role_in(uuid) to authenticated, service_role;

-- Rollback:
-- create or replace function public.member_role_in(ws uuid) returns public.member_role
--   language sql stable security definer set search_path = public
--   as $$ select role from public.workspace_members where workspace_id = ws and user_id = auth.uid() $$;
