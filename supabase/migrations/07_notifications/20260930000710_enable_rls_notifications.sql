-- Module: notifications
-- Each user reads and marks only their own; teammates can notify each other.
alter table public.notifications enable row level security;

create policy "notifications: own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications: mark read" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: teammates create" on public.notifications for insert with check (
  public.can_edit(workspace_id)
  and exists (select 1 from public.workspace_members m where m.workspace_id = notifications.workspace_id and m.user_id = notifications.user_id)
);
