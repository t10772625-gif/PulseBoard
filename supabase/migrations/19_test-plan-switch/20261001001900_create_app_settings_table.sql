-- Module: test plan switch (until Stripe billing exists)
-- Server-wide switches that only the database owner changes (SQL editor).
-- RLS is on and there are NO policies and NO grants: browsers can't read or
-- write it; only SECURITY DEFINER functions owned by postgres consult it.

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from public, anon, authenticated;

-- ON for development. Turn OFF before production / when Stripe is connected:
--   update public.app_settings set value = 'false', updated_at = now() where key = 'test_plan_switch';
insert into public.app_settings (key, value) values ('test_plan_switch', 'true');

-- Rollback:
-- drop table public.app_settings;
