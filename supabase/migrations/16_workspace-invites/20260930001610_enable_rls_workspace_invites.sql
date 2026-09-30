-- Module: workspace invites (pre-approved emails)
-- Only people with the member.manage permission see or change invites.
-- Only the Owner can grant the Admin role; nobody can grant Owner (table check).
alter table public.workspace_invites enable row level security;

create policy "invites: managers read" on public.workspace_invites for select
  using (public.has_permission(workspace_id, 'member.manage'));

create policy "invites: managers create" on public.workspace_invites for insert
  with check (
    public.has_permission(workspace_id, 'member.manage')
    and invited_by = auth.uid()
    and (role <> 'Admin' or public.member_role_in(workspace_id) = 'Owner')
    and accepted_at is null and accepted_by is null and revoked_at is null
  );

create policy "invites: managers revoke" on public.workspace_invites for update
  using (public.has_permission(workspace_id, 'member.manage') and accepted_at is null)
  with check (public.has_permission(workspace_id, 'member.manage'));

-- Browser may only supply workspace, email and role on insert (id, inviter,
-- expiry come from defaults) and may only set revoked_at on update.
grant select on public.workspace_invites to authenticated;
grant insert (workspace_id, email, role) on public.workspace_invites to authenticated;
grant update (revoked_at) on public.workspace_invites to authenticated;
