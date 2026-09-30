-- Module: auth & workspaces
-- A workspace is one company/team (the tenant). Its plan gates features and limits.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan public.plan_tier not null default 'free',
  created_at timestamptz not null default now()
);
