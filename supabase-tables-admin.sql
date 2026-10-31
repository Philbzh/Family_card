-- ============================================================================
--  Our Table — SEVERAL TABLES + A REAL ADMIN  (run AFTER supabase-family-sync.sql)
--
--  WHAT THIS DOES
--    * Every table (group) can have an ADMIN. The admin key is created in the app on the admin's own
--      device; the database keeps only a fingerprint of it, never the key itself.
--    * Once a table has an admin, only the admin can: remove a member, rename the table, and make a
--      new code (which cuts off everybody who only had the old code). Anyone with the code can still
--      play and add themselves.
--    * Tables without an admin keep working exactly as before until somebody claims them.
--
--  HOW TO RUN: Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
-- ============================================================================

begin;

create table if not exists public.family_tables (
  table_code text primary key,
  name       text,
  admin_hash text,
  created_at timestamptz not null default now()
);
alter table public.family_tables enable row level security;

create or replace function public.tc_hash(p text) returns text
language sql immutable as $$ select encode(sha256(convert_to(coalesce(p, ''), 'UTF8')), 'hex') $$;

-- is this the admin of the table? (only used inside the functions below)
create or replace function public.tc_is_admin(c text, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_tables t
                  where t.table_code = c and t.admin_hash is not null and t.admin_hash = public.tc_hash(k));
$$;
create or replace function public.tc_has_admin(c text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_tables t where t.table_code = c and t.admin_hash is not null);
$$;

-- does the table have an admin, and what is it called?
create or replace function public.table_info(p_code text)
returns table(has_admin boolean, name text)
language sql stable security definer set search_path = public as $$
  select (t.admin_hash is not null), t.name from public.family_tables t
   where length(public.tc_clean(p_code)) >= 6 and t.table_code = public.tc_clean(p_code);
$$;

-- a brand-new table: the creator becomes its admin. False if the code is taken by a table that has an admin.
create or replace function public.create_table(p_code text, p_name text, p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if length(coalesce(p_key, '')) < 12 then raise exception 'admin key too short'; end if;
  if public.tc_has_admin(c) then return false; end if;
  insert into public.family_tables (table_code, name, admin_hash)
  values (c, left(coalesce(p_name, ''), 30), public.tc_hash(p_key))
  on conflict (table_code) do update set admin_hash = excluded.admin_hash, name = excluded.name;
  return true;
end $$;

-- an existing table (for example your original family code) that has no admin yet: the first to claim it wins
create or replace function public.claim_table(p_code text, p_name text, p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if length(coalesce(p_key, '')) < 12 then raise exception 'admin key too short'; end if;
  if public.tc_has_admin(c) then return false; end if;
  insert into public.family_tables (table_code, name, admin_hash)
  values (c, left(coalesce(p_name, ''), 30), public.tc_hash(p_key))
  on conflict (table_code) do update set admin_hash = excluded.admin_hash, name = coalesce(nullif(excluded.name, ''), public.family_tables.name);
  return true;
end $$;

-- the two actions that become admin-only (the old two-argument versions are replaced; old apps still work through the defaults)
drop function if exists public.remove_member(text, text);
drop function if exists public.set_settings(text, text, text);

create or replace function public.remove_member(p_code text, p_name text, p_key text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := left(btrim(coalesce(p_name, '')), 40);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if public.tc_has_admin(c) and not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  if n = '' then return; end if;
  insert into public.family_members (table_code, name_key, name, deleted, updated_at)
  values (c, lower(n), n, true, now())
  on conflict (table_code, name_key) do update set deleted = true, updated_at = now();
end $$;

create or replace function public.set_settings(p_code text, p_name text, p_year text, p_key text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if public.tc_has_admin(c) and not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  insert into public.family_settings (table_code, table_name, table_year, updated_at)
  values (c, left(coalesce(p_name, ''), 30), left(coalesce(p_year, ''), 8), now())
  on conflict (table_code) do update set table_name = excluded.table_name, table_year = excluded.table_year, updated_at = now();
  update public.family_tables set name = left(coalesce(p_name, ''), 30) where table_code = c;
end $$;

-- a new code for the whole table (everything moves with it). Whoever only knows the old code is out.
create or replace function public.rotate_code(p_code text, p_key text, p_new text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := public.tc_clean(p_new);
begin
  if length(c) < 6 or length(n) < 6 then raise exception 'table code too short'; end if;
  if not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  if exists (select 1 from public.family_tables where table_code = n)
     or exists (select 1 from public.family_members where table_code = n)
     or exists (select 1 from public.family_settings where table_code = n)
     or exists (select 1 from public.game_history where table_code = n) then
    raise exception 'that code is already in use';
  end if;
  update public.game_history   set table_code = n where table_code = c;
  update public.family_members set table_code = n where table_code = c;
  update public.family_settings set table_code = n where table_code = c;
  update public.family_tables  set table_code = n where table_code = c;
  return n;
end $$;

revoke all on function public.tc_hash(text)                          from public;
revoke all on function public.tc_is_admin(text, text)                from public;
revoke all on function public.tc_has_admin(text)                     from public;
revoke all on function public.table_info(text)                       from public;
revoke all on function public.create_table(text, text, text)         from public;
revoke all on function public.claim_table(text, text, text)          from public;
revoke all on function public.remove_member(text, text, text)        from public;
revoke all on function public.set_settings(text, text, text, text)   from public;
revoke all on function public.rotate_code(text, text, text)          from public;
grant execute on function public.table_info(text)                    to anon, authenticated;
grant execute on function public.create_table(text, text, text)      to anon, authenticated;
grant execute on function public.claim_table(text, text, text)       to anon, authenticated;
grant execute on function public.remove_member(text, text, text)     to anon, authenticated;
grant execute on function public.set_settings(text, text, text, text) to anon, authenticated;
grant execute on function public.rotate_code(text, text, text)       to anon, authenticated;

commit;

-- CHECK: expected no rows (the table cannot be touched directly), then the list of tables with an admin.
select tablename, cmd, policyname from pg_policies where schemaname = 'public' and tablename = 'family_tables';
select table_code, name, (admin_hash is not null) as has_admin from public.family_tables;
