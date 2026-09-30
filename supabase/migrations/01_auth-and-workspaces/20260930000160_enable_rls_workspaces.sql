-- Module: auth & workspaces
-- Members can read their workspace; only the Owner can rename it.
-- The plan column can't be changed from the client (billing uses the service role).
alter table public.workspaces enable row level security;

create policy "workspaces: members read" on public.workspaces for select using (public.is_member(id));
create policy "workspaces: owner renames" on public.workspaces for update
  using (public.member_role_in(id) = 'Owner')
  with check (
    public.member_role_in(id) = 'Owner'
    and plan = (select w.plan from public.workspaces w where w.id = workspaces.id)
  );
