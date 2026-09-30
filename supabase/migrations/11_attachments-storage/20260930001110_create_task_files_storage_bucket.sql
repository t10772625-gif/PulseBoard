-- Module: attachments & storage
-- Private bucket; 25 MB per file; images, video and PDF only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-files', 'task-files', false, 26214400, array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'])
on conflict (id) do nothing;
