-- Module: realtime
-- Broadcast changes so every open board updates live (RLS still applies to subscribers).
alter publication supabase_realtime add table public.tasks, public.comments, public.notifications;
