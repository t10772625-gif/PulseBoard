-- Module: API grants
-- New Supabase projects no longer grant table privileges to the API roles by
-- default, so every query from the app failed with "permission denied" before
-- RLS was even checked. This grants the signed-in role (`authenticated`) only
-- the operations each table has RLS policies for; RLS still decides which rows.
-- `anon` gets nothing: public share pages go through get_shared() only.
-- Protected columns (workspaces.plan, profiles.email, member ids) get no UPDATE
-- grant at all, as a second lock on top of the policies.

grant usage on schema public to authenticated;

-- Workspaces: read; only the name can be changed (plan is billing-only)
grant select on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;

-- Profiles: read; only the display name can be changed
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Members: add/remove; only role and capacity can change on an existing row
grant select, insert, delete on public.workspace_members to authenticated;
grant update (role, capacity) on public.workspace_members to authenticated;

-- Boards and work items
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.board_columns to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert on public.task_events to authenticated;
grant select, insert, delete on public.attachments to authenticated;

-- Inbox, clients, automations, sharing, permissions
grant select, insert, update on public.notifications to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.automation_rules to authenticated;
grant select on public.webhook_deliveries to authenticated;
grant select, insert, update on public.share_links to authenticated;
grant select, insert, update, delete on public.role_permissions to authenticated;

-- Email log: the server route inserts, then records the send result
grant select, insert on public.email_outbox to authenticated;
grant update (status, provider_id, error) on public.email_outbox to authenticated;

-- Identity sequences used by inserts above
grant usage on sequence public.task_events_id_seq to authenticated;
grant usage on sequence public.email_outbox_id_seq to authenticated;
