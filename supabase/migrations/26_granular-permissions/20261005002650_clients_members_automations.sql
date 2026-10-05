-- Module: granular permissions (Phase 2, user decisions 2026-10-05)
-- One "manage" switch per area becomes create / edit / delete:
--   clients:            insert client.create · update client.edit · delete client.delete
--   workspace_invites:  create / revoke member.invite · read member.invite or member.edit
--   workspace_members:  change role member.edit · remove member.remove
--                       (same rule as 21_simplify-roles, user design 2026-10-05: exactly one
--                        Admin per workspace = owner / buyer; nobody changes or removes the
--                        Admin row and nobody can be made Admin; the self-role-change trigger stays)
--   automation_rules:   insert automation.create · update automation.edit · delete automation.delete
-- Reading clients (page.clients) and rules (page.automations) is unchanged.
-- Requires 21_simplify-roles (Admin-only is_admin, one-Admin index, self-role trigger).

-- Clients ------------------------------------------------------------------
drop policy if exists "clients: manage" on public.clients;
drop policy if exists "clients: create" on public.clients;
drop policy if exists "clients: edit" on public.clients;
drop policy if exists "clients: delete" on public.clients;

create policy "clients: create" on public.clients
  for insert to authenticated
  with check (
    public.has_permission(clients.workspace_id, 'client.create')
    and (clients.project_id is null or exists (select 1 from public.projects p where p.id = clients.project_id and p.workspace_id = clients.workspace_id))
  );
create policy "clients: edit" on public.clients
  for update to authenticated
  using (public.has_permission(clients.workspace_id, 'client.edit'))
  with check (
    public.has_permission(clients.workspace_id, 'client.edit')
    and (clients.project_id is null or exists (select 1 from public.projects p where p.id = clients.project_id and p.workspace_id = clients.workspace_id))
  );
create policy "clients: delete" on public.clients
  for delete to authenticated
  using (public.has_permission(clients.workspace_id, 'client.delete'));

-- Invites ------------------------------------------------------------------
drop policy if exists "invites: managers create" on public.workspace_invites;
create policy "invites: managers create" on public.workspace_invites
  for insert to authenticated
  with check (
    public.has_permission(workspace_invites.workspace_id, 'member.invite')
    and workspace_invites.invited_by = auth.uid()
    and workspace_invites.role <> 'Admin'
    and workspace_invites.accepted_at is null
    and workspace_invites.accepted_by is null
    and workspace_invites.revoked_at is null
  );

drop policy if exists "invites: managers read" on public.workspace_invites;
create policy "invites: managers read" on public.workspace_invites
  for select to authenticated
  using (
    public.has_permission(workspace_invites.workspace_id, 'member.invite')
    or public.has_permission(workspace_invites.workspace_id, 'member.edit')
  );

drop policy if exists "invites: managers revoke" on public.workspace_invites;
create policy "invites: managers revoke" on public.workspace_invites
  for update to authenticated
  using (public.has_permission(workspace_invites.workspace_id, 'member.invite') and workspace_invites.accepted_at is null)
  with check (public.has_permission(workspace_invites.workspace_id, 'member.invite'));

-- Members ------------------------------------------------------------------
drop policy if exists "members: change" on public.workspace_members;
create policy "members: change" on public.workspace_members
  for update to authenticated
  using (
    public.has_permission(workspace_members.workspace_id, 'member.edit')
    and workspace_members.role <> 'Admin'
  )
  with check (
    public.has_permission(workspace_members.workspace_id, 'member.edit')
    and workspace_members.role <> 'Admin'
  );

drop policy if exists "members: remove" on public.workspace_members;
create policy "members: remove" on public.workspace_members
  for delete to authenticated
  using (
    public.has_permission(workspace_members.workspace_id, 'member.remove')
    and workspace_members.role <> 'Admin'
  );

-- Automation rules ---------------------------------------------------------
drop policy if exists "automation_rules: manage" on public.automation_rules;
drop policy if exists "automation_rules: create" on public.automation_rules;
drop policy if exists "automation_rules: edit" on public.automation_rules;
drop policy if exists "automation_rules: delete" on public.automation_rules;

create policy "automation_rules: create" on public.automation_rules
  for insert to authenticated
  with check (public.has_permission(automation_rules.workspace_id, 'automation.create'));
create policy "automation_rules: edit" on public.automation_rules
  for update to authenticated
  using (public.has_permission(automation_rules.workspace_id, 'automation.edit'))
  with check (public.has_permission(automation_rules.workspace_id, 'automation.edit'));
create policy "automation_rules: delete" on public.automation_rules
  for delete to authenticated
  using (public.has_permission(automation_rules.workspace_id, 'automation.delete'));

-- Rollback: drop the policies created above, then re-run
-- 14_role-permissions (clients / automation_rules "… manage" policies),
-- 18_security-hardening/20261001001880_lock_workspace_columns_on_update.sql (clients project check) and
-- batch A (21_simplify-roles, revised 2026-10-05) for invites / members.
