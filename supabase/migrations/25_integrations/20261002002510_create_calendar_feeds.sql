-- Module: integrations — calendar subscription feed (Google Calendar, Outlook, Apple)
-- Each person can create a private feed URL for THEIR OWN open tasks with a due
-- date in one workspace. Calendar apps fetch it without signing in, so the URL
-- holds a 128-bit random token (made by the database). Revoking it stops the feed.
-- Public link (CLAUDE.md §1.3): approved by the user on 2026-10-02.
-- What the feed shows: task key, title, board name and due date only — no
-- descriptions, comments, files or other people's tasks.

create table if not exists public.calendar_feeds (
  token text primary key default encode(extensions.gen_random_bytes(16), 'hex'),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists calendar_feeds_user_idx on public.calendar_feeds (user_id, workspace_id);
alter table public.calendar_feeds enable row level security;

create policy "calendar_feeds: own read" on public.calendar_feeds
  for select to authenticated using (calendar_feeds.user_id = auth.uid());
create policy "calendar_feeds: own create" on public.calendar_feeds
  for insert to authenticated
  with check (calendar_feeds.user_id = auth.uid() and public.is_member(calendar_feeds.workspace_id));
create policy "calendar_feeds: own revoke" on public.calendar_feeds
  for update to authenticated
  using (calendar_feeds.user_id = auth.uid())
  with check (calendar_feeds.user_id = auth.uid() and calendar_feeds.revoked_at is not null);

grant select on public.calendar_feeds to authenticated;
grant insert (workspace_id) on public.calendar_feeds to authenticated;
grant update (revoked_at) on public.calendar_feeds to authenticated;

-- The only way to read a feed without signing in. Returns nothing for an unknown
-- or revoked token, or when the person is no longer a member of the workspace.
create or replace function public.get_calendar_feed(p_token text)
returns table (task_key text, title text, board text, due_date date)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.task_prefix || '-' || t.number,
    left(t.title, 200),
    left(p.name, 100),
    t.due_date
  from public.calendar_feeds f
  join public.workspace_members m on m.workspace_id = f.workspace_id and m.user_id = f.user_id
  join public.tasks t on t.workspace_id = f.workspace_id and t.assignee_id = f.user_id
  join public.projects p on p.id = t.project_id and p.workspace_id = f.workspace_id
  join public.workspaces w on w.id = f.workspace_id
  where f.token = p_token
    and char_length(p_token) = 32
    and f.revoked_at is null
    and t.deleted_at is null
    and t.archived_at is null
    and t.status <> 'done'
    and t.due_date is not null
  order by t.due_date
  limit 500
$$;

revoke execute on function public.get_calendar_feed(text) from public;
grant execute on function public.get_calendar_feed(text) to anon, authenticated;

-- Rollback:
-- drop function if exists public.get_calendar_feed(text);
-- drop table if exists public.calendar_feeds;
