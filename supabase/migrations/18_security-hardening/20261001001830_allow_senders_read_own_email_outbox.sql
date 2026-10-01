-- Module: security hardening
-- /api/email rate-limits each sender by counting their own email_outbox rows
-- from the last hour. Only admins could read the table, so for Members the
-- count was always 0 and the 50/hour limit never applied. Senders can now read
-- the rows they queued themselves (nothing from other senders or workspaces).
-- Policies are OR-ed, so "email_outbox: admins read" still works as before.

create policy "email_outbox: senders read own" on public.email_outbox for select
  to authenticated
  using (created_by = auth.uid());

-- Rollback:
-- drop policy "email_outbox: senders read own" on public.email_outbox;
