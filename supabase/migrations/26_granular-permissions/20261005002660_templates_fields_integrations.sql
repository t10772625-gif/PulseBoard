-- Module: granular permissions (Phase 2, user decisions 2026-10-05)
-- Tables from 24_workspace-data and 25_integrations get the separate switches:
--   task_templates:      insert / update template.create · delete template.delete   (was can_edit)
--   custom_field_defs:   insert / update field.create    · delete field.delete      (was can_edit)
--   workspace_webhooks:  insert integration.connect · update integration.edit · delete integration.disconnect
--                        (was automation.manage)
-- 24 and 25 are reviewed separately and may not be applied yet, so each part runs only
-- when its table exists. Re-run this file after applying 24 / 25 (it is safe to re-run).
-- Fixed statements only (no user input) inside EXECUTE.

do $$
begin
  if to_regclass('public.task_templates') is not null then
    execute 'drop policy if exists "task_templates: editors manage" on public.task_templates';
    execute 'drop policy if exists "task_templates: create" on public.task_templates';
    execute 'drop policy if exists "task_templates: change" on public.task_templates';
    execute 'drop policy if exists "task_templates: delete" on public.task_templates';
    execute $p$create policy "task_templates: create" on public.task_templates for insert to authenticated
      with check (public.has_permission(task_templates.workspace_id, 'template.create'))$p$;
    execute $p$create policy "task_templates: change" on public.task_templates for update to authenticated
      using (public.has_permission(task_templates.workspace_id, 'template.create'))
      with check (public.has_permission(task_templates.workspace_id, 'template.create'))$p$;
    execute $p$create policy "task_templates: delete" on public.task_templates for delete to authenticated
      using (public.has_permission(task_templates.workspace_id, 'template.delete'))$p$;
  end if;

  if to_regclass('public.custom_field_defs') is not null then
    execute 'drop policy if exists "custom_field_defs: editors manage" on public.custom_field_defs';
    execute 'drop policy if exists "custom_field_defs: create" on public.custom_field_defs';
    execute 'drop policy if exists "custom_field_defs: change" on public.custom_field_defs';
    execute 'drop policy if exists "custom_field_defs: delete" on public.custom_field_defs';
    execute $p$create policy "custom_field_defs: create" on public.custom_field_defs for insert to authenticated
      with check (public.has_permission(custom_field_defs.workspace_id, 'field.create'))$p$;
    execute $p$create policy "custom_field_defs: change" on public.custom_field_defs for update to authenticated
      using (public.has_permission(custom_field_defs.workspace_id, 'field.create'))
      with check (public.has_permission(custom_field_defs.workspace_id, 'field.create'))$p$;
    execute $p$create policy "custom_field_defs: delete" on public.custom_field_defs for delete to authenticated
      using (public.has_permission(custom_field_defs.workspace_id, 'field.delete'))$p$;
  end if;

  if to_regclass('public.workspace_webhooks') is not null then
    execute 'drop policy if exists "workspace_webhooks: managers add" on public.workspace_webhooks';
    execute 'drop policy if exists "workspace_webhooks: managers change" on public.workspace_webhooks';
    execute 'drop policy if exists "workspace_webhooks: managers remove" on public.workspace_webhooks';
    execute $p$create policy "workspace_webhooks: managers add" on public.workspace_webhooks for insert to authenticated
      with check (public.has_permission(workspace_webhooks.workspace_id, 'integration.connect'))$p$;
    execute $p$create policy "workspace_webhooks: managers change" on public.workspace_webhooks for update to authenticated
      using (public.has_permission(workspace_webhooks.workspace_id, 'integration.edit'))
      with check (public.has_permission(workspace_webhooks.workspace_id, 'integration.edit'))$p$;
    execute $p$create policy "workspace_webhooks: managers remove" on public.workspace_webhooks for delete to authenticated
      using (public.has_permission(workspace_webhooks.workspace_id, 'integration.disconnect'))$p$;
  end if;
end $$;

-- Rollback: drop the policies above and re-run the matching parts of
-- 24_workspace-data/20261002002410_enable_rls_workspace_config_tables.sql and
-- 25_integrations/20261002002500_create_workspace_webhooks.sql.
