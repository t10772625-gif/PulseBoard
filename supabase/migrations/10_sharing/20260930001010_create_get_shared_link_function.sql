-- Module: sharing
-- Public (anonymous) read of a shared board or task by token. Returns only
-- titles, statuses and due dates: never comments, emails or internal fields.
create or replace function public.get_shared(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare link public.share_links;
begin
  select * into link from public.share_links
  where token = p_token and revoked_at is null and (expires_at is null or expires_at > now());
  if not found then return null; end if;

  if link.kind = 'task' then
    return (select jsonb_build_object('kind', 'task', 'task',
      jsonb_build_object('title', t.title, 'status', t.status, 'due_date', t.due_date, 'description', t.description))
      from public.tasks t where t.id = link.target_id and t.deleted_at is null);
  end if;

  return (select jsonb_build_object(
      'kind', 'board',
      'project', jsonb_build_object('name', p.name, 'description', p.description),
      'tasks', coalesce((select jsonb_agg(jsonb_build_object('title', t.title, 'status', t.status, 'due_date', t.due_date) order by t.created_at)
                         from public.tasks t where t.project_id = p.id and t.deleted_at is null and t.archived_at is null), '[]'::jsonb))
    from public.projects p where p.id = link.target_id);
end;
$$;

grant execute on function public.get_shared(text) to anon, authenticated;
