-- Run once in the Supabase SQL Editor.
-- Users could previously UPDATE their own quota row through the REST API and
-- reset request_count. The quota RPC now runs as SECURITY DEFINER and signed-in
-- users no longer get any direct access to the quota table.

revoke all on table public.nuvio_ai_rate_limits from public, anon, authenticated;

drop policy if exists "Authenticated users can read own AI quota" on public.nuvio_ai_rate_limits;
drop policy if exists "Authenticated users can insert own AI quota" on public.nuvio_ai_rate_limits;
drop policy if exists "Authenticated users can update own AI quota" on public.nuvio_ai_rate_limits;

alter function public.consume_nuvio_ai_quota() security definer;
alter function public.consume_nuvio_ai_quota() owner to postgres;

revoke all on function public.consume_nuvio_ai_quota() from public, anon;
grant execute on function public.consume_nuvio_ai_quota() to authenticated, service_role;
