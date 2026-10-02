-- Module: workspace data that used to live only in the browser (lost on refresh)
--   custom_field_defs  — Settings → Custom fields (values stay in tasks.custom_fields)
--   task_templates     — board / task templates
--   saved_filters      — per user, per workspace
--   workspace_settings — branding, SLA targets, AI opt-in, custom domain
--   user_preferences   — per user (daily digest)
-- Every table: RLS on, workspace (or user) scoped, explicit grants (ADR-001 / ADR-004).

-- Custom field definitions
create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  type text not null check (type in ('text', 'number', 'select')),
  options text[] not null default '{}' check (cardinality(options) <= 50),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists custom_field_defs_ws_idx on public.custom_field_defs (workspace_id, position);

-- Templates (a template is a list of task drafts, stored as JSON)
create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  tasks jsonb not null default '[]' check (jsonb_typeof(tasks) = 'array' and jsonb_array_length(tasks) <= 100),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists task_templates_ws_idx on public.task_templates (workspace_id);

-- Saved filters (private to their creator)
create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  query text not null check (char_length(query) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists saved_filters_user_idx on public.saved_filters (user_id, workspace_id);

-- One settings row per workspace
create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  brand_name text check (char_length(brand_name) <= 60),
  brand_color text check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  sla_high_days int not null default 3 check (sla_high_days between 1 and 365),
  sla_medium_days int not null default 7 check (sla_medium_days between 1 and 365),
  sla_low_days int not null default 14 check (sla_low_days between 1 and 365),
  ai_enabled boolean not null default false,
  ai_enabled_by uuid references auth.users (id) on delete set null,
  ai_enabled_at timestamptz,
  custom_domain text check (custom_domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' and char_length(custom_domain) <= 253),
  domain_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  updated_at timestamptz not null default now()
);

insert into public.workspace_settings (workspace_id)
select w.id from public.workspaces w
on conflict (workspace_id) do nothing;

-- Every new workspace gets its settings row
create or replace function public.create_workspace_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_settings (workspace_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists workspaces_create_settings on public.workspaces;
create trigger workspaces_create_settings
  after insert on public.workspaces
  for each row execute function public.create_workspace_settings();
revoke execute on function public.create_workspace_settings() from public, anon, authenticated;

-- AI opt-in can only be switched by an Admin, and who / when is recorded by the database
create or replace function public.stamp_ai_opt_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ai_enabled is distinct from old.ai_enabled then
    if auth.uid() is not null and not public.is_admin(new.workspace_id) then
      raise exception 'Only an Admin can turn AI on or off' using errcode = '42501';
    end if;
    new.ai_enabled_by := auth.uid();
    new.ai_enabled_at := now();
  else
    new.ai_enabled_by := old.ai_enabled_by;
    new.ai_enabled_at := old.ai_enabled_at;
  end if;
  new.domain_token := old.domain_token;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists workspace_settings_stamp on public.workspace_settings;
create trigger workspace_settings_stamp
  before update on public.workspace_settings
  for each row execute function public.stamp_ai_opt_in();
revoke execute on function public.stamp_ai_opt_in() from public, anon, authenticated;

-- Per-user preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  digest_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Rollback (drops the data in these tables):
-- drop trigger if exists workspaces_create_settings on public.workspaces;
-- drop function if exists public.create_workspace_settings();
-- drop table if exists public.user_preferences, public.workspace_settings, public.saved_filters, public.task_templates, public.custom_field_defs;
-- drop function if exists public.stamp_ai_opt_in();
