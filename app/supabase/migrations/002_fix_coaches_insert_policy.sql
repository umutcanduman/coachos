-- Allow authenticated users to insert their own coach profile
create policy "Users can create own coach profile"
  on public.coaches for insert
  with check (user_id = auth.uid());
