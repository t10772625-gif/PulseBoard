-- Module: clients & agency (budgets, billable rates, scheduled reports)
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  name text not null,
  email text not null,
  hourly_rate numeric not null default 0 check (hourly_rate >= 0),
  budget numeric not null default 0 check (budget >= 0),
  report_day text not null default 'Fri' check (report_day in ('Fri', 'Mon', 'none')),
  created_at timestamptz not null default now()
);
create index clients_workspace_id_idx on public.clients (workspace_id);
