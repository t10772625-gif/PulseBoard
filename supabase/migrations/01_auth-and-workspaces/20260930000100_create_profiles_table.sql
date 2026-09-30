-- Module: auth & workspaces
-- Public profile for each auth user (name + email shown to teammates).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);
