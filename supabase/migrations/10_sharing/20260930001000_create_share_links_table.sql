-- Module: sharing (client portal, public read-only links)
create table public.share_links (
  token text primary key default encode(gen_random_bytes(16), 'hex'),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('task', 'board')),
  target_id uuid not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);
create index share_links_workspace_idx on public.share_links (workspace_id);
