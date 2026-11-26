-- Nuvio user state schema (current).  
-- Table + RPC used by js/cloud-sync.js. Keep aligned with that file.  
-- Run in the Supabase SQL editor.  
  
create table if not exists public.nuvio_user_state (  
    user_id uuid primary key references auth.users(id) on delete cascade,  
    state jsonb not null default '{}'::jsonb,  
    revision bigint not null default 0 check (revision >= 0),  
    updated_at timestamptz not null default now()  
);  
  
alter table public.nuvio_user_state enable row level security;  
  
drop policy if exists "Nuvio users can read own state" on public.nuvio_user_state;  
create policy "Nuvio users can read own state"  
    on public.nuvio_user_state for select  
    to authenticated  
    using ((select auth.uid()) = user_id);  
  
drop policy if exists "Nuvio users can insert own state" on public.nuvio_user_state;  
create policy "Nuvio users can insert own state"  
    on public.nuvio_user_state for insert  
    to authenticated  
    with check ((select auth.uid()) = user_id);  
  
drop policy if exists "Nuvio users can update own state" on public.nuvio_user_state;  
create policy "Nuvio users can update own state"  
    on public.nuvio_user_state for update  
    to authenticated  
    using ((select auth.uid()) = user_id)  
    with check ((select auth.uid()) = user_id);  
  
grant select, insert, update on public.nuvio_user_state to authenticated;  
grant execute on function public.nuvio_save_state(jsonb, bigint) to authenticated;  
  
-- Realtime is used by the client to receive changes from other signed-in devices.  
do $$  
begin  
    if not exists (  
        select 1  
        from pg_publication_tables  
        where pubname = 'supabase_realtime'  
          and schemaname = 'public'  
          and tablename = 'nuvio_user_state'  
    ) then  
        alter publication supabase_realtime add table public.nuvio_user_state;  
    end if;  
end  
$$;  
  
-- Optimistic-concurrency save. The client sends p_expected_revision; on a  
-- mismatch this raises SQLSTATE 40001 'revision_conflict' so the client can  
-- re-fetch the remote state and surface a conflict.  
create or replace function public.nuvio_save_state(  
    p_state jsonb,  
    p_expected_revision bigint  
)  
returns public.nuvio_user_state  
language plpgsql  
set search_path to public  
as $function$  
declare  
    result public.nuvio_user_state;  
begin  
    if auth.uid() is null then  
        raise exception 'Authentication required';  
    end if;  
  
    insert into public.nuvio_user_state (user_id, state, revision, updated_at)  
    values (auth.uid(), coalesce(p_state, '{}'::jsonb), 1, now())  
    on conflict (user_id) do update  
        set state = excluded.state,  
            revision = public.nuvio_user_state.revision + 1,  
            updated_at = now()  
        where public.nuvio_user_state.revision = coalesce(p_expected_revision, 0)  
    returning * into result;  
  
    if result is null then  
        raise exception 'revision_conflict' using errcode = '40001';  
    end if;  
  
    return result;  
end;  
$function$;  
  
-- Internal backup table (no client access; RLS enabled, no public grants).  
-- create table if not exists public.nuvio_data_backups (  
--     backup_id bigint generated always as identity primary key,  
--     user_id uuid not null references auth.users(id) on delete cascade,  
--     data jsonb not null,  
--     version bigint not null,  
--     backed_up_at timestamptz not null default now(),  
--     original_updated_at timestamptz  
-- );  
-- alter table public.nuvio_data_backups enable row level security;  
