-- Module: board columns
-- Members read the columns of their boards; Owner/Admin manage them.
alter table public.board_columns enable row level security;

create policy "board_columns: read" on public.board_columns for select using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_member(p.workspace_id))
);
create policy "board_columns: admins write" on public.board_columns for all using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_admin(p.workspace_id))
) with check (
  exists (select 1 from public.projects p where p.id = project_id and public.is_admin(p.workspace_id))
);
