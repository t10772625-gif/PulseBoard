-- Module: workspace data — AI usage counter and team pulse survey
--
-- AI usage: the monthly cap (Basic 0 / Pro 200 / Enterprise 1,000 assistant
-- actions) used to be a counter in the browser that reset on refresh. Now the
-- database counts per workspace per month, and use_ai_action() is the only way to
-- spend one: it checks the caller is a member who can edit, the plan's cap, and
-- returns the new count (or raises when the cap is reached). The server AI route
-- calls it before contacting the AI provider, so the cap can't be skipped.

create table if not exists public.ai_usage (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  month date not null,
  used int not null default 0 check (used >= 0),
  primary key (workspace_id, month)
);
alter table public.ai_usage enable row level security;
create policy "ai_usage: read" on public.ai_usage
  for select to authenticated using (public.is_member(ai_usage.workspace_id));
grant select on public.ai_usage to authenticated;
-- No insert / update grant: only use_ai_action() writes

create or replace function public.ai_monthly_cap(p public.plan_tier)
returns int
language sql
immutable
set search_path = public
as $$ select case p when 'enterprise' then 1000 when 'pro' then 200 else 0 end $$;

create or replace function public.use_ai_action(ws uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  n int;
  this_month date := date_trunc('month', now())::date;
begin
  if auth.uid() is null or not public.can_edit(ws) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  select public.ai_monthly_cap(w.plan) into cap from public.workspaces w where w.id = ws;
  insert into public.ai_usage (workspace_id, month, used) values (ws, this_month, 0)
  on conflict (workspace_id, month) do nothing;
  update public.ai_usage set used = used + 1
  where workspace_id = ws and month = this_month and used < cap
  returning used into n;
  if n is null then
    raise exception 'AI limit reached' using errcode = 'P0001', hint = 'ai_limit';
  end if;
  return n;
end;
$$;

revoke execute on function public.use_ai_action(uuid) from public, anon;
grant execute on function public.use_ai_action(uuid) to authenticated;

-- Team pulse survey (feeds Analytics → Team wellbeing). One answer per person per
-- week, 1 (bad) – 5 (great). Shown as a limited signal, never an HR decision
-- (CLAUDE.md §12). Each person sees their own answers; Admins see the team's.
create table if not exists public.pulse_survey (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  week date not null default date_trunc('week', now())::date,
  score int not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id, week)
);
alter table public.pulse_survey enable row level security;
create policy "pulse_survey: read own or admin" on public.pulse_survey
  for select to authenticated
  using (public.is_member(pulse_survey.workspace_id) and (pulse_survey.user_id = auth.uid() or public.is_admin(pulse_survey.workspace_id)));
grant select on public.pulse_survey to authenticated;
-- No insert / update grant: answers go through answer_pulse() (one row per person
-- per week; an upsert from the browser would need an UPDATE grant on workspace_id)
create or replace function public.answer_pulse(ws uuid, s int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_member(ws) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if s < 1 or s > 5 then
    raise exception 'Invalid request' using errcode = '22023';
  end if;
  insert into public.pulse_survey (workspace_id, user_id, week, score)
  values (ws, auth.uid(), date_trunc('week', now())::date, s)
  on conflict (workspace_id, user_id, week) do update set score = excluded.score;
end;
$$;
revoke execute on function public.answer_pulse(uuid, int) from public, anon;
grant execute on function public.answer_pulse(uuid, int) to authenticated;

-- Rollback:
-- drop function if exists public.answer_pulse(uuid, int);
-- drop table if exists public.pulse_survey;
-- drop function if exists public.use_ai_action(uuid);
-- drop function if exists public.ai_monthly_cap(public.plan_tier);
-- drop table if exists public.ai_usage;
