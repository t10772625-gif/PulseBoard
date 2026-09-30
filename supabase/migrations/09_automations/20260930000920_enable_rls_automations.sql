-- Module: automations
-- Members read rules; Owner/Admin manage them and see deliveries. Deliveries are
-- written by the server with the service role, so there is no client insert policy.
alter table public.automation_rules enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "automation_rules: read" on public.automation_rules for select using (public.is_member(workspace_id));
create policy "automation_rules: admins write" on public.automation_rules for all
  using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy "webhook_deliveries: admins read" on public.webhook_deliveries for select using (public.is_admin(workspace_id));
