-- Module: workspace data — RLS and grants
-- Read: members of the workspace (saved filters / preferences: only their owner).
-- Write: custom fields and templates — anyone who can edit (same as before, when
-- this lived in the browser); settings — Admins (branding, SLA, AI, domain).

alter table public.custom_field_defs enable row level security;
alter table public.task_templates enable row level security;
alter table public.saved_filters enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.user_preferences enable row level security;

create policy "custom_field_defs: read" on public.custom_field_defs
  for select to authenticated using (public.is_member(custom_field_defs.workspace_id));
create policy "custom_field_defs: editors manage" on public.custom_field_defs
  for all to authenticated
  using (public.can_edit(custom_field_defs.workspace_id))
  with check (public.can_edit(custom_field_defs.workspace_id));

create policy "task_templates: read" on public.task_templates
  for select to authenticated using (public.is_member(task_templates.workspace_id));
create policy "task_templates: editors manage" on public.task_templates
  for all to authenticated
  using (public.can_edit(task_templates.workspace_id))
  with check (public.can_edit(task_templates.workspace_id));

create policy "saved_filters: own" on public.saved_filters
  for all to authenticated
  using (saved_filters.user_id = auth.uid() and public.is_member(saved_filters.workspace_id))
  with check (saved_filters.user_id = auth.uid() and public.is_member(saved_filters.workspace_id));

create policy "workspace_settings: read" on public.workspace_settings
  for select to authenticated using (public.is_member(workspace_settings.workspace_id));
create policy "workspace_settings: admins update" on public.workspace_settings
  for update to authenticated
  using (public.is_admin(workspace_settings.workspace_id))
  with check (public.is_admin(workspace_settings.workspace_id));

create policy "user_preferences: own" on public.user_preferences
  for all to authenticated
  using (user_preferences.user_id = auth.uid())
  with check (user_preferences.user_id = auth.uid());

-- Grants: ids / workspace / owner columns are never updatable (ADR-004)
grant select, delete on public.custom_field_defs to authenticated;
grant insert (id, workspace_id, name, type, options, position) on public.custom_field_defs to authenticated;
grant update (name, type, options, position) on public.custom_field_defs to authenticated;

grant select, delete on public.task_templates to authenticated;
grant insert (id, workspace_id, name, tasks) on public.task_templates to authenticated;
grant update (name, tasks) on public.task_templates to authenticated;

grant select, delete on public.saved_filters to authenticated;
grant insert (id, workspace_id, name, query) on public.saved_filters to authenticated;
grant update (name, query) on public.saved_filters to authenticated;

grant select on public.workspace_settings to authenticated;
grant update (brand_name, brand_color, sla_high_days, sla_medium_days, sla_low_days, ai_enabled, custom_domain) on public.workspace_settings to authenticated;

grant select on public.user_preferences to authenticated;
grant insert (digest_mode) on public.user_preferences to authenticated;
grant update (digest_mode) on public.user_preferences to authenticated;

-- Rollback: drop the policies above (dropping the tables in …2400's rollback removes them too)
