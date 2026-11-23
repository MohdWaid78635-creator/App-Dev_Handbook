create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 60),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;
revoke all on public.habits from anon, authenticated;
grant select, insert, update, delete on public.habits to authenticated;
create index habits_user_id on public.habits(user_id);

create policy own_read on public.habits for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.habits for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.habits for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.habits for delete to authenticated using ((select auth.uid()) = user_id);
