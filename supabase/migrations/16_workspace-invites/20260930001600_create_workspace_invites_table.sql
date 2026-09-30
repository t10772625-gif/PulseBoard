-- Module: workspace invites (pre-approved emails)
-- An admin grants an email a role in their workspace. When someone signs up
-- with that email, the sign-up trigger adds them to that workspace instead of
-- creating a personal one. No email is sent yet (no SMTP): the admin tells the
-- person to register. The row doubles as the audit record (who, when, accepted,
-- revoked). DEV SHORTCUT: with "Confirm email" OFF, whoever registers the email
-- first gets the access. Replace with tokenised email invites before launch.
create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (
    email = lower(btrim(email))
    and length(email) <= 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  role public.member_role not null default 'Member' check (role <> 'Owner'),
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);

-- One open invite per email per workspace; the sign-up lookup is by email
create unique index workspace_invites_open_email_uq on public.workspace_invites (workspace_id, email)
  where accepted_at is null and revoked_at is null;
create index workspace_invites_email_open_idx on public.workspace_invites (email)
  where accepted_at is null and revoked_at is null;
