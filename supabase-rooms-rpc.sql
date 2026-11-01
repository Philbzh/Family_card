-- ============================================================================
--  Our Table — ROOMS through protected functions   (STEP 1 of 2: only ADDS things, closes nothing)
--  HOW TO RUN: Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
--
--  What this does: it adds three functions the app can use to read and save an online room:
--      room_get(code)                  -> the state of one room (only while it is recent)
--      room_put(code, state)           -> create or save a room (checks the code and the size)
--      room_cas(code, expected, state) -> save only if nobody else saved in between (the app's "compare and swap")
--  Nothing is closed by this file. Everything keeps working exactly as before. The new app version uses the
--  functions when they exist and falls back to the old way when they do not, so the order does not matter.
--
--  STEP 2 (later, only after every device runs the new app version): run supabase-rooms-close.sql, which
--  takes the direct table access away, so nobody can list or change rooms any more.
-- ============================================================================

begin;

-- the rooms table: make sure the columns the functions use exist (they do already; this changes nothing)
create table if not exists public.card_rooms (
  id         text primary key,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- A room code is 4 to 16 letters, digits or dashes: anything else is refused before it reaches the table.
create or replace function public.room_get(p_id text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select r.state
    from public.card_rooms r
   where p_id ~ '^[A-Za-z0-9-]{4,16}$'
     and r.id = p_id
     and r.updated_at > now() - interval '12 hours';
$$;

create or replace function public.room_put(p_id text, p_state jsonb)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_id is null or p_id !~ '^[A-Za-z0-9-]{4,16}$' then raise exception 'bad room code'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'bad state'; end if;
  if octet_length(p_state::text) > 262144 then raise exception 'state too large'; end if;
  insert into public.card_rooms (id, state, updated_at)
  values (p_id, p_state, now())
  on conflict (id) do update set state = excluded.state, updated_at = now();
  return true;
end $$;

create or replace function public.room_cas(p_id text, p_expected text, p_state jsonb)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_id is null or p_id !~ '^[A-Za-z0-9-]{4,16}$' then raise exception 'bad room code'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'bad state'; end if;
  if octet_length(p_state::text) > 262144 then raise exception 'state too large'; end if;
  update public.card_rooms
     set state = p_state, updated_at = now()
   where id = p_id
     and updated_at > now() - interval '12 hours'
     and state->>'_ts' = p_expected;
  get diagnostics n = row_count;
  return n > 0;
end $$;

revoke all on function public.room_get(text)              from public;
revoke all on function public.room_put(text, jsonb)       from public;
revoke all on function public.room_cas(text, text, jsonb) from public;
grant execute on function public.room_get(text)              to anon, authenticated;
grant execute on function public.room_put(text, jsonb)       to anon, authenticated;
grant execute on function public.room_cas(text, text, jsonb) to anon, authenticated;

commit;

-- CHECK: should list the three functions.
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and proname in ('room_get', 'room_put', 'room_cas') order by proname;
