-- Module: board columns
-- Custom columns per board (HR / Sales / Dev templates) with WIP limits and order.
-- status_key is what tasks.status stores ('todo', 'prog', 'rev', 'done' or a custom key).
create table public.board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  status_key text not null,
  label text not null check (length(label) between 1 and 60),
  wip_limit int not null default 0 check (wip_limit >= 0),
  position int not null,
  unique (project_id, status_key)
);
create index board_columns_project_id_idx on public.board_columns (project_id, position);
