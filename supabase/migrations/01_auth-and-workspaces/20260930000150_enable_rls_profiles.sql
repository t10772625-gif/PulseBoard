-- Module: auth & workspaces
-- Profiles: you can read yourself and anyone who shares a workspace with you.
alter table public.profiles enable row level security;

create policy "profiles: read self and teammates" on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from public.workspace_members me
    join public.workspace_members them on them.workspace_id = me.workspace_id
    where me.user_id = auth.uid() and them.user_id = profiles.id
  )
);
create policy "profiles: update self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
