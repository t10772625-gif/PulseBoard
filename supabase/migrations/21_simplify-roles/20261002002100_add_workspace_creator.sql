-- Module: simplified roles (Admin / Sub Admin / Member / Viewer)
-- The separate Owner role goes away (user decision 2026-10-02). The person who
-- created a workspace becomes an Admin like any other, but stays protected:
-- nobody can demote or remove them, and only they control billing (plan) and,
-- later, workspace deletion. That person is recorded here.

alter table public.workspaces
  add column if not exists created_by uuid references auth.users (id) on delete set null;

-- Backfill: the current Owner of each workspace is its creator
update public.workspaces w
set created_by = m.user_id
from public.workspace_members m
where m.workspace_id = w.id
  and m.role = 'Owner'
  and w.created_by is null;

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);

-- Browsers may read it (workspaces SELECT policy already limits rows to members)
-- but never change it: no UPDATE grant is added for created_by.
grant select (created_by) on public.workspaces to authenticated;

-- Rollback:
-- drop index if exists public.workspaces_created_by_idx;
-- alter table public.workspaces drop column if exists created_by;
