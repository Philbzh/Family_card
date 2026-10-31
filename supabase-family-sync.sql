-- ============================================================================
--  Our Table — FAMILY SYNC  (run AFTER supabase-rls.sql and supabase-table-code.sql)
--
--  WHAT THIS DOES
--    Today the family code shares only a short list of results (game, winner, players, date).
--    After this script, everyone who types the same family code gets the SAME everything:
--      * every game ever played under the code, with the scores of all players, the moment text,
--        the winner's avatar (the old rows keep what they have: game, winner, players, date),
--      * the family MEMBERS with their avatars (add or remove one on a device, every device follows),
--      * the table name on the nameplate,
--      * trophies, records and counters are worked out by each device from that shared record.
--    The app fetches only what is new, keeps a copy on the device (opens fast, works offline) and
--    tells the other devices when something changed.
--
--  HOW TO RUN  (about one minute, no code to edit)
--    1. supabase.com -> your project -> SQL Editor -> New query.
--    2. Paste this whole file -> Run.
--    3. Read the result tables at the end. In the app: 🔒 Your data -> Family sync -> Sync now.
--
--  SAFE TO RUN AGAIN. Until it has been run the app keeps working with the short list.
--  Nothing is deleted. The table stays closed to direct access; only the functions below can be called,
--  and each of them needs the exact family code.
-- ============================================================================

begin;

-- 1. More columns for the results, a server time to fetch "what is new", and a key against duplicates.
alter table public.game_history
  add column if not exists client_id     text,
  add column if not exists winner_avatar text,
  add column if not exists moment        text,
  add column if not exists scores        jsonb,
  add column if not exists stats         jsonb,
  add column if not exists synced_at     timestamptz;
update public.game_history set synced_at = coalesce(played_at, now()) where synced_at is null;
alter table public.game_history alter column synced_at set default now();
create unique index if not exists game_history_client_uq   on public.game_history (table_code, client_id) where client_id is not null;
create index        if not exists game_history_sync_idx    on public.game_history (table_code, synced_at);

-- 2. Members and settings of a family. No policies on purpose: only the functions below can touch them.
create table if not exists public.family_members (
  table_code text not null,
  name_key   text not null,
  name       text not null,
  avatar     text,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (table_code, name_key)
);
alter table public.family_members enable row level security;

create table if not exists public.family_settings (
  table_code text primary key,
  table_name text,
  table_year text,
  updated_at timestamptz not null default now()
);
alter table public.family_settings enable row level security;

-- 3. The doors. SECURITY DEFINER = they work although nobody can touch the tables directly.
create or replace function public.tc_clean(p text) returns text
language sql immutable as $$ select regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g') $$;

-- add a finished game (same name as before, now with scores, moment and avatar; a game is never stored twice)
create or replace function public.add_history(p_code text, p_row jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  c text := public.tc_clean(p_code);
  r public.game_history;
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if length(p_row::text) > 12000 then raise exception 'row too large'; end if;
  select * into r from jsonb_populate_record(null::public.game_history, p_row);
  insert into public.game_history
         (device_id, game_id, mode, winner_name, players, rules, played_at, table_code, client_id, winner_avatar, moment, scores, stats)
  values (r.device_id, r.game_id, r.mode, r.winner_name, r.players, r.rules, coalesce(r.played_at, now()), c, r.client_id, left(r.winner_avatar, 32), left(r.moment, 200), r.scores, r.stats)
  on conflict (table_code, client_id) where client_id is not null do nothing;
end $$;

-- the rows that are new since a moment (the first call with null brings everything, a thousand at a time)
create or replace function public.history_since(p_code text, p_since timestamptz default null, p_limit int default 1000)
returns setof public.game_history
language sql stable security definer set search_path = public as $$
  select *
    from public.game_history
   where length(public.tc_clean(p_code)) >= 6
     and table_code = public.tc_clean(p_code)
     and (p_since is null or synced_at > p_since)
   order by synced_at asc
   limit least(greatest(coalesce(p_limit, 1000), 1), 2000);
$$;

create or replace function public.members_for(p_code text)
returns table(name text, avatar text, deleted boolean, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.name, m.avatar, m.deleted, m.updated_at
    from public.family_members m
   where length(public.tc_clean(p_code)) >= 6 and m.table_code = public.tc_clean(p_code)
   order by m.updated_at asc;
$$;

create or replace function public.upsert_member(p_code text, p_name text, p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := left(btrim(coalesce(p_name, '')), 40);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if n = '' then raise exception 'name missing'; end if;
  insert into public.family_members (table_code, name_key, name, avatar, deleted, updated_at)
  values (c, lower(n), n, left(p_avatar, 32), false, now())
  on conflict (table_code, name_key)
  do update set name = excluded.name, avatar = coalesce(excluded.avatar, public.family_members.avatar), deleted = false, updated_at = now();
end $$;

create or replace function public.remove_member(p_code text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := left(btrim(coalesce(p_name, '')), 40);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if n = '' then return; end if;
  insert into public.family_members (table_code, name_key, name, deleted, updated_at)
  values (c, lower(n), n, true, now())
  on conflict (table_code, name_key) do update set deleted = true, updated_at = now();
end $$;

create or replace function public.settings_for(p_code text)
returns table(table_name text, table_year text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.table_name, s.table_year, s.updated_at
    from public.family_settings s
   where length(public.tc_clean(p_code)) >= 6 and s.table_code = public.tc_clean(p_code);
$$;

create or replace function public.set_settings(p_code text, p_name text, p_year text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  insert into public.family_settings (table_code, table_name, table_year, updated_at)
  values (c, left(coalesce(p_name, ''), 30), left(coalesce(p_year, ''), 8), now())
  on conflict (table_code) do update set table_name = excluded.table_name, table_year = excluded.table_year, updated_at = now();
end $$;

revoke all on function public.add_history(text, jsonb)                 from public;
revoke all on function public.history_since(text, timestamptz, int)    from public;
revoke all on function public.members_for(text)                        from public;
revoke all on function public.upsert_member(text, text, text)          from public;
revoke all on function public.remove_member(text, text)                from public;
revoke all on function public.settings_for(text)                       from public;
revoke all on function public.set_settings(text, text, text)           from public;
grant execute on function public.add_history(text, jsonb)              to anon, authenticated;
grant execute on function public.history_since(text, timestamptz, int) to anon, authenticated;
grant execute on function public.members_for(text)                     to anon, authenticated;
grant execute on function public.upsert_member(text, text, text)       to anon, authenticated;
grant execute on function public.remove_member(text, text)             to anon, authenticated;
grant execute on function public.settings_for(text)                    to anon, authenticated;
grant execute on function public.set_settings(text, text, text)        to anon, authenticated;

commit;

-- 4. CHECK THE WORK -----------------------------------------------------------

-- (a) Expected: NO rows (the three tables cannot be touched directly).
select tablename, cmd, policyname from pg_policies
 where schemaname = 'public' and tablename in ('game_history', 'family_members', 'family_settings');

-- (b) Games per family code, and how many have a client_id (new ones) — old rows have none.
select coalesce(table_code, '(none)') as table_code, count(*) as games, count(client_id) as with_client_id
  from public.game_history group by 1 order by 2 desc;

-- (c) Your code must return rows (replace the code, run on its own):
--     select count(*) from public.history_since('YOUR-FAMILY-CODE', null, 2000);

-- ----------------------------------------------------------------------------
-- OPTIONAL: your old results include test games and games of other people (from the days when
-- every phone wrote into one list). Look first, delete second, each on its own:
--
--   -- who appears most often under your code?
--   select p as name, count(*) as games
--     from public.game_history g, jsonb_array_elements_text(to_jsonb(g.players)) as p
--    where g.table_code = 'YOURFAMILYCODE'
--    group by 1 order by 2 desc limit 30;
--
--   -- remove every game that mentions none of your family's names:
--   delete from public.game_history
--    where table_code = 'YOURFAMILYCODE'
--      and not (players::text ilike '%Philippe%' or players::text ilike '%Max%');
--
-- OPTIONAL: put your family's members in at once (the app also does it from every device by itself):
--   select public.upsert_member('YOUR-FAMILY-CODE', 'Philippe', null);
-- ----------------------------------------------------------------------------
