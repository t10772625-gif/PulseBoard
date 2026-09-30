-- Module: email notifications
-- Admins can read the log; the server route inserts as the signed-in editor.
alter table public.email_outbox enable row level security;

create policy "email_outbox: admins read" on public.email_outbox for select using (public.is_admin(workspace_id));
create policy "email_outbox: editors queue" on public.email_outbox for insert
  with check (public.can_edit(workspace_id) and created_by = auth.uid());
create policy "email_outbox: sender updates status" on public.email_outbox for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());
