-- Fixed per-user AI quota: 30 requests per rolling 60-second window.
-- Keep this source SQL aligned with the live Supabase schema and function.
-- The RPC runs as SECURITY INVOKER; authenticated table access is constrained
-- by the ownership policies below.

create table if not exists public.nuvio_ai_rate_limits (
    user_id uuid primary key references auth.users(id) on delete cascade,
    window_started_at timestamptz not null default now(),
    request_count integer not null default 0 check (request_count >= 0)
);

alter table public.nuvio_ai_rate_limits enable row level security;

-- The browser/API caller must not access quota rows directly as anon.
-- The authenticated RPC can only read/write the caller's own row.
revoke all on table public.nuvio_ai_rate_limits from public, anon, authenticated;
grant select, insert, update on table public.nuvio_ai_rate_limits to authenticated;

drop policy if exists "Authenticated users can read own AI quota" on public.nuvio_ai_rate_limits;
create policy "Authenticated users can read own AI quota"
    on public.nuvio_ai_rate_limits
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can insert own AI quota" on public.nuvio_ai_rate_limits;
create policy "Authenticated users can insert own AI quota"
    on public.nuvio_ai_rate_limits
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can update own AI quota" on public.nuvio_ai_rate_limits;
create policy "Authenticated users can update own AI quota"
    on public.nuvio_ai_rate_limits
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop function if exists public.consume_nuvio_ai_quota(integer, integer);

create or replace function public.consume_nuvio_ai_quota()
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
    allowed boolean;
    current_user_id uuid := (select auth.uid());
    v_now timestamptz := statement_timestamp();
begin
    if current_user_id is null then
        return false;
    end if;

    insert into public.nuvio_ai_rate_limits as existing_row
        (user_id, window_started_at, request_count)
    values (current_user_id, v_now, 1)
    on conflict (user_id) do update
    set window_started_at = case
            when existing_row.window_started_at <= v_now - interval '60 seconds'
            then v_now else existing_row.window_started_at end,
        request_count = case
            when existing_row.window_started_at <= v_now - interval '60 seconds'
            then 1 else existing_row.request_count + 1 end
    returning request_count <= 30 into allowed;

    return coalesce(allowed, false);
end;
$function$;

revoke all on function public.consume_nuvio_ai_quota() from public, anon;
grant execute on function public.consume_nuvio_ai_quota() to authenticated, service_role;
