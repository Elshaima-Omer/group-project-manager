-- Run in Supabase → SQL Editor if notifications never appear
-- (bell icon stays empty after accept/reject/submit)

alter table public.notifications enable row level security;

-- Let any logged-in user CREATE a notification (for another user's inbox)
drop policy if exists "authenticated_insert_notifications" on public.notifications;
create policy "authenticated_insert_notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);

-- Each user can only READ their own notifications
drop policy if exists "users_read_own_notifications" on public.notifications;
create policy "users_read_own_notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- Each user can mark their own notifications as read
drop policy if exists "users_update_own_notifications" on public.notifications;
create policy "users_update_own_notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
