-- ============================================================================
--  Our Table — table codes for game_history  (run AFTER supabase-rls.sql)
--
--  WHAT THIS DOES
--    Until now every phone that opened the app wrote into, and read from, ONE shared
--    game_history table: a stranger given the link could read your family's first names and
--    games, and their own games showed up in your House Legends.
--
--    After this script:
--      * every row belongs to a TABLE CODE (a private word like K7M2Q-9XRTA),
--      * the app can no longer read or write the table directly (the two public policies are
--        removed),
--      * it can only call two functions that need the exact code:
--            history_for(code)        -> that table's rows only
--            add_history(code, row)   -> adds a row to that table only
--      * someone without your code sees nothing of yours, and cannot list other codes.
--
--  HOW TO RUN  (about two minutes)
--    1. In the app: open 🔒 Your data on your own device and read your table code, OR decide
--       on a code you like (at least 6 letters/numbers, e.g. MULLER-FAMILY-2026). Type the
--       SAME code into 🔒 Your data on every family device ("Use it").
--    2. supabase.com -> your project -> SQL Editor -> New query.
--    3. Replace  PUT-YOUR-FAMILY-CODE-HERE  below (one place) with that code.
--    4. Paste the whole file -> Run. It stops with an error if you forgot step 3.
--    5. Read the three result tables at the end.
--
--  YOUR OLD RESULTS
--    The ~7,000 rows already in the table have no code. Step 3 gives all of them to YOUR code,
--    so your family keeps its history. (Some of them are test games and other people's games;
--    they cannot be told apart, so they come along. See the optional clean-up at the very end.)
--
--  SAFE TO RUN AGAIN. The app keeps working the old way until this has been run, and switches
--  over by itself afterwards (no new release needed).
-- ============================================================================

begin;

-- 1. A column for the code, and an index so reading one table stays fast.
alter table public.game_history add column if not exists table_code text;
create index if not exists game_history_table_code_idx on public.game_history (table_code, played_at desc);

-- 2. Give every old row to your family's code. Refuses to run with the placeholder.
do $$
declare
  family_code text := regexp_replace(upper('PUT-YOUR-FAMILY-CODE-HERE'), '[^A-Z0-9]', '', 'g');
begin
  if family_code = 'PUTYOURFAMILYCODEHERE' or length(family_code) < 6 then
    raise exception 'Edit PUT-YOUR-FAMILY-CODE-HERE first (at least 6 letters or numbers).';
  end if;
  update public.game_history set table_code = family_code where table_code is null;
end $$;

-- 3. The only two doors into the table. SECURITY DEFINER = they run with the owner's rights,
--    so they work even though the public key may no longer touch the table directly.
create or replace function public.history_for(p_code text)
returns setof public.game_history
language sql stable security definer set search_path = public as $$
  select *
    from public.game_history
   where length(regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g')) >= 6
     and table_code = regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g')
   order by played_at desc
   limit 500;
$$;

create or replace function public.add_history(p_code text, p_row jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if length(p_row::text) > 6000 then raise exception 'row too large'; end if;
  insert into public.game_history (device_id, game_id, mode, winner_name, players, rules, table_code)
  select r.device_id, r.game_id, r.mode, r.winner_name, r.players, r.rules, c
    from jsonb_populate_record(null::public.game_history, p_row) as r;
end $$;

revoke all on function public.history_for(text)        from public;
revoke all on function public.add_history(text, jsonb) from public;
grant execute on function public.history_for(text)        to anon, authenticated;
grant execute on function public.add_history(text, jsonb) to anon, authenticated;

-- 4. Close the old doors: no direct reading or writing of game_history any more.
alter table public.game_history enable row level security;
drop policy if exists "history readable"   on public.game_history;
drop policy if exists "history insertable" on public.game_history;

commit;

-- 5. CHECK THE WORK -----------------------------------------------------------

-- (a) Policies left on game_history. Expected: NO rows (nothing can touch the table directly).
select tablename, cmd, policyname from pg_policies
 where schemaname = 'public' and tablename = 'game_history';

-- (b) Rows per code. Expected: one code (yours) holding all the old rows, and no NULLs.
select coalesce(table_code, '(none)') as table_code, count(*) as rows
  from public.game_history group by 1 order by 2 desc;

-- (c) Your code must return rows through the function (replace the code, then run on its own):
--     select count(*) from public.history_for('PUT-YOUR-FAMILY-CODE-HERE');

-- ----------------------------------------------------------------------------
-- OPTIONAL CLEAN-UP (run only if you want it, on its own):
-- Old rows from tests or visitors can be removed, e.g. everything that does not mention
-- one of your own family's names. Look first, delete second:
--
--   select game_id, winner_name, players, played_at from public.game_history
--    where not (players::text ilike '%YourName%' or players::text ilike '%SonsName%')
--    order by played_at desc limit 50;
--
--   delete from public.game_history
--    where not (players::text ilike '%YourName%' or players::text ilike '%SonsName%');
-- ----------------------------------------------------------------------------
