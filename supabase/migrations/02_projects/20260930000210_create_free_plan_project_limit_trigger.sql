-- Module: projects (boards)
-- Free plan allows 1 project per workspace (pricing.md). Enforced in the database
-- so the limit can't be bypassed by calling the API directly.
create or replace function public.enforce_project_limit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (select plan from public.workspaces where id = new.workspace_id) = 'free'
     and (select count(*) from public.projects where workspace_id = new.workspace_id) >= 1 then
    raise exception 'The Free plan allows 1 project. Upgrade to Pro for unlimited projects.';
  end if;
  return new;
end;
$$;

create trigger projects_plan_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();
