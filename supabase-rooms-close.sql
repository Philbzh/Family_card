-- ============================================================================
--  Our Table — ROOMS: CLOSE the table   (STEP 2 of 2)
--  RUN THIS ONLY AFTER: (1) supabase-rooms-rpc.sql has been run, and (2) EVERY device (iPad, laptop, your son's)
--  shows the new app version (🔒 Your data -> version 270 or higher). A device with an older app would lose online play.
--
--  What this does: it takes the direct access to the rooms table away from the public key. After this, nobody can
--  list rooms or change one by hand; the app reads and saves rooms only through room_get / room_put / room_cas
--  (which check the code format and the size, and only see rooms of the last 12 hours).
--
--  IF SOMETHING GOES WRONG: run the last block of this file ("UNDO") and online play works as before.
-- ============================================================================

begin;

-- drop every policy on the table, then leave none: the table is closed to the public key
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'card_rooms' loop
    execute format('drop policy %I on public.card_rooms', p.policyname);
  end loop;
end $$;

alter table public.card_rooms enable row level security;
revoke all on public.card_rooms from anon, authenticated;

commit;

-- CHECK 1: no policies left.
select count(*) as policies_left from pg_policies where schemaname = 'public' and tablename = 'card_rooms';

-- ----------------------------------------------------------------------------
-- UNDO (only if online play breaks): run this block to open the table again.
-- ----------------------------------------------------------------------------
-- begin;
-- grant select, insert, update on public.card_rooms to anon;
-- create policy "rooms readable"   on public.card_rooms for select to anon using (updated_at > now() - interval '12 hours');
-- create policy "rooms insertable" on public.card_rooms for insert to anon with check (true);
-- create policy "rooms writable"   on public.card_rooms for update to anon using (updated_at > now() - interval '12 hours') with check (true);
-- commit;
