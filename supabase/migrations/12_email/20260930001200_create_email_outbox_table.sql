-- Module: email notifications
-- Every email the server sends (or tried to send), for debugging and rate limiting.
create table public.email_outbox (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  to_user_id uuid references auth.users (id) on delete set null,
  to_email text not null,
  subject text not null,
  template text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_id text,
  error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index email_outbox_workspace_time_idx on public.email_outbox (workspace_id, created_at desc);
create index email_outbox_sender_time_idx on public.email_outbox (created_by, created_at desc);
