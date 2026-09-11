-- ============================================================================
--  Our Table — Supabase Row Level Security
--
--  HOW TO RUN
--    1. supabase.com  →  log in  →  open your project (bibxhrqxbecaukmschbe)
--    2. left sidebar  →  SQL Editor  →  "New query"
--    3. paste this whole file  →  Run
--    4. READ THE TWO TABLES IT PRINTS AT THE END. That is the actual check.
--
--  Safe to run more than once. It removes every existing policy on these two
--  tables and recreates the intended set, so it does not matter what your
--  current policies are called.
--
--  WHY WIPE AND RECREATE RATHER THAN EDIT: Postgres policies are *permissive*
--  and combine with OR. Adding a restrictive policy next to an existing
--  "USING (true)" one changes nothing at all — the permissive one still lets
--  everything through. The only reliable fix is to clear them and start clean.
--
--  WHAT WAS MEASURED against this project on 2026-09-05, using only the
--  publishable key that is already public in the repo:
--
--    card_rooms    SELECT unfiltered -> 200, all 70 rooms readable
--                  UPDATE            -> 200, permitted
--                  DELETE            -> 200, PERMITTED   <-- the hole
--    game_history  SELECT unfiltered -> 200, all 531 rows readable
--                  DELETE            -> 400, already blocked (good)
--
--  A readable room is a readable game state, and that contains every player's
--  hand and the remaining deck order. Oldest room still sitting there: 14 Aug.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. RLS on. If this is off, policies are decoration.
-- ---------------------------------------------------------------------------
alter table public.card_rooms   enable row level security;
alter table public.game_history enable row level security;


-- ---------------------------------------------------------------------------
-- 2. Clear every existing policy on both tables, whatever they are named.
--    The NOTICE lines in the output tell you what was there before.
-- ---------------------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select policyname, tablename
      from pg_policies
     where schemaname = 'public'
       and tablename in ('card_rooms','game_history')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
    raise notice 'dropped existing policy % on %', p.policyname, p.tablename;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- 3. card_rooms — readable and writable, but only while the game is recent,
--    and never deletable.
--
--    No DELETE policy is created below. That is the point: today anyone with
--    the published key can wipe every room, including games in progress. The
--    app never deletes a room (there is no .delete() call anywhere in the
--    source), so it loses nothing.
--
--    The 12-hour window does three jobs at once: an abandoned room stops being
--    a readable copy of your family's cards, the table stops growing forever,
--    and anyone enumerating rooms reaches only the last few hours instead of
--    every game you have ever played. Lower it if you like; a game night fits
--    comfortably inside it.
-- ---------------------------------------------------------------------------
create policy "rooms readable" on public.card_rooms
  for select to anon
  using (updated_at > now() - interval '12 hours');

create policy "rooms insertable" on public.card_rooms
  for insert to anon
  with check (true);

create policy "rooms writable" on public.card_rooms
  for update to anon
  using      (updated_at > now() - interval '12 hours')
  with check (true);


-- ---------------------------------------------------------------------------
-- 4. game_history — append only.
--
--    SELECT stays unrestricted ON PURPOSE. fetchFamilyHistory() reads the whole
--    table with no WHERE clause to build the Family screen, House Legends and
--    Rivalries; restricting it breaks those screens.
--
--    Know what that means: your family's first names, which games they play and
--    when, are readable by anyone who has the app's URL. That is the price of
--    having no accounts. A decision to make on purpose, not a bug to fix.
--
--    No UPDATE and no DELETE policy: rows can be added, never altered or removed.
-- ---------------------------------------------------------------------------
create policy "history readable" on public.game_history
  for select to anon using (true);

create policy "history insertable" on public.game_history
  for insert to anon with check (true);

commit;


-- ---------------------------------------------------------------------------
-- 5. Housekeeping: remove rooms that are already stale. Separate from the
--    transaction above so a problem here cannot roll the policies back.
--    Safe — the app only ever reads a room it just created or joined.
-- ---------------------------------------------------------------------------
delete from public.card_rooms where updated_at < now() - interval '2 days';


-- ---------------------------------------------------------------------------
-- 6. CHECK THE WORK. Read this output rather than assuming.
-- ---------------------------------------------------------------------------

-- (a) Every table the public key can see. RLS must be true on ALL of them.
--     Anything here you do not recognise is exposed to the same key.
select tablename, rowsecurity as rls_enabled
  from pg_tables
 where schemaname = 'public'
 order by tablename;

-- (b) The policies that now exist. Expected, and nothing else:
--       card_rooms    INSERT / SELECT / UPDATE      (no DELETE)
--       game_history  INSERT / SELECT               (no UPDATE, no DELETE)
select tablename, cmd, policyname
  from pg_policies
 where schemaname = 'public'
 order by tablename, cmd;
