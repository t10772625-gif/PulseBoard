-- Module: role permissions (RBAC)
drop policy if exists "automation_rules: read" on public.automation_rules;
drop policy if exists "automation_rules: admins write" on public.automation_rules;
drop policy if exists "webhook_deliveries: admins read" on public.webhook_deliveries;

create policy "automation_rules: read" on public.automation_rules for select using (public.has_permission(workspace_id, 'page.automations'));
create policy "automation_rules: manage" on public.automation_rules for all
  using (public.has_permission(workspace_id, 'automation.manage'))
  with check (public.has_permission(workspace_id, 'automation.manage'));
create policy "webhook_deliveries: read" on public.webhook_deliveries for select using (public.has_permission(workspace_id, 'automation.manage'));
