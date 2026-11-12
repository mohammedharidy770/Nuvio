-- Nuvio account-scoped cloud snapshot storage.
-- Keep this schema aligned with js/cloud-sync.js (public.nuvio_data).

create table if not exists public.nuvio_data (
    user_id uuid primary key references auth.users(id) on delete cascade,
    data jsonb not null default '{}'::jsonb,
    version bigint not null default 1 check (version >= 1),
    updated_at timestamptz not null default now()
);

alter table public.nuvio_data enable row level security;

drop policy if exists "Nuvio users can read own data" on public.nuvio_data;
create policy "Nuvio users can read own data"
    on public.nuvio_data for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Nuvio users can insert own data" on public.nuvio_data;
create policy "Nuvio users can insert own data"
    on public.nuvio_data for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Nuvio users can update own data" on public.nuvio_data;
create policy "Nuvio users can update own data"
    on public.nuvio_data for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.nuvio_data to authenticated;

-- Realtime is used by the client to receive changes from other signed-in devices.
do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'nuvio_data'
    ) then
        alter publication supabase_realtime add table public.nuvio_data;
    end if;
end
$$;
