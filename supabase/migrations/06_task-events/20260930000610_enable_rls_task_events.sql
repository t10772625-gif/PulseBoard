-- Module: task events
-- Readable by members; editors append events as themselves; nobody edits or deletes history.
alter table public.task_events enable row level security;

create policy "task_events: read" on public.task_events for select using (public.is_member(workspace_id));
create policy "task_events: editors append" on public.task_events for insert
  with check (public.can_edit(workspace_id) and actor_id = auth.uid());
