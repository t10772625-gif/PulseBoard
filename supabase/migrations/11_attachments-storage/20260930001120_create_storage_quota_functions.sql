-- Module: attachments & storage
-- Plan storage quota: Free 1 GB, Pro 5 GB, Legendary 10 GB (pricing.md).
create or replace function public.storage_limit_bytes(ws uuid)
returns bigint language sql stable security definer set search_path = public
as $$
  select case plan when 'free' then 1::bigint when 'pro' then 5::bigint else 10::bigint end * 1024 * 1024 * 1024
  from public.workspaces where id = ws
$$;

create or replace function public.storage_used_bytes(ws uuid)
returns bigint language sql stable security definer set search_path = public
as $$ select coalesce(sum(size_bytes), 0)::bigint from public.attachments where workspace_id = ws $$;

-- Reject an attachment that would take the workspace over its quota
create or replace function public.enforce_storage_quota()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.storage_used_bytes(new.workspace_id) + new.size_bytes > public.storage_limit_bytes(new.workspace_id) then
    raise exception 'Storage limit reached for your plan. Upgrade or remove files.';
  end if;
  return new;
end;
$$;

create trigger attachments_storage_quota
  before insert on public.attachments
  for each row execute function public.enforce_storage_quota();
