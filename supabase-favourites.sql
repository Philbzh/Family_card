-- ============================================================================
--  Our Table — FAVOURITES per table  (run AFTER supabase-family-sync.sql and supabase-tables-admin.sql)
--  Every table keeps its list of favourite games; every device of the table shows the same list.
--  HOW TO RUN: Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
-- ============================================================================

begin;

alter table public.family_settings
  add column if not exists favourites jsonb,
  add column if not exists favs_at    timestamptz;

-- settings_for now also returns the favourites (the old function has to go first: its answer changes shape)
drop function if exists public.settings_for(text);
create or replace function public.settings_for(p_code text)
returns table(table_name text, table_year text, updated_at timestamptz, favourites jsonb, favs_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.table_name, s.table_year, s.updated_at, s.favourites, s.favs_at
    from public.family_settings s
   where length(public.tc_clean(p_code)) >= 6 and s.table_code = public.tc_clean(p_code);
$$;

-- anyone at the table may star a game (a list of game names, at most 40)
create or replace function public.set_favourites(p_code text, p_list jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if p_list is null or jsonb_typeof(p_list) <> 'array' or jsonb_array_length(p_list) > 40 then raise exception 'bad list'; end if;
  if length(p_list::text) > 2000 then raise exception 'list too large'; end if;
  insert into public.family_settings (table_code, favourites, favs_at, updated_at)
  values (c, p_list, now(), now())
  on conflict (table_code) do update set favourites = excluded.favourites, favs_at = now();
end $$;

revoke all on function public.settings_for(text)             from public;
revoke all on function public.set_favourites(text, jsonb)    from public;
grant execute on function public.settings_for(text)          to anon, authenticated;
grant execute on function public.set_favourites(text, jsonb) to anon, authenticated;

commit;

-- CHECK: expected no error. (Your table's favourites show up here once somebody has starred a game.)
select table_code, favourites, favs_at from public.family_settings order by favs_at desc nulls last limit 5;
