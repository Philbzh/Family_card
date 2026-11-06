-- ============================================================================
--  Our Table — OWNER AND ADMINISTRATORS  (run AFTER supabase-tables-admin.sql and supabase-invites.sql)
--
--  WHAT THIS ADDS (nothing changes for a table until its owner appoints somebody)
--    * The OWNER of a table is the person who claimed or created it (the holder of the admin key). The owner's
--      name is stored so that the app can show who the owner is.
--    * The owner can appoint other people as ADMINISTRATORS and take that away again. The appointment is a one-time
--      link: the person opens it on their own device and that device gets its own key (the database keeps only a
--      fingerprint, as for the owner).
--    * Administrators can do everything an admin could before: remove members, rename the table, make and revoke
--      invitations, suspend or remove devices. Only the OWNER can appoint or remove administrators and make a new
--      table code. The owner can never be removed.
--
--  HOW TO RUN: Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
--  UNDO: supabase-admins-undo.sql
-- ============================================================================

begin;

alter table public.family_tables add column if not exists owner_name text;

create table if not exists public.table_admins (
  table_code text        not null,
  name       text        not null,
  key_hash   text        not null,
  created_at timestamptz not null default now(),
  primary key (table_code, key_hash)
);
alter table public.table_admins enable row level security;

create table if not exists public.table_admin_grants (
  token_hash text        primary key,
  table_code text        not null,
  name       text        not null,
  expires_at timestamptz not null,
  used       boolean     not null default false
);
alter table public.table_admin_grants enable row level security;
-- no policies on these two tables: nobody can touch them directly, only the functions below

-- the table code moves (rotate_code): the administrators and open appointments move with it
create or replace function public.tc_move_admins() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.table_code <> old.table_code then
    update public.table_admins       set table_code = new.table_code where table_code = old.table_code;
    update public.table_admin_grants set table_code = new.table_code where table_code = old.table_code;
  end if;
  return new;
end $$;
drop trigger if exists tc_move_admins_trigger on public.family_tables;
create trigger tc_move_admins_trigger after update of table_code on public.family_tables
  for each row execute function public.tc_move_admins();

-- the owner: the holder of the original admin key
create or replace function public.tc_is_owner(c text, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_tables t
                  where t.table_code = c and t.admin_hash is not null and t.admin_hash = public.tc_hash(k));
$$;

-- an admin is the owner OR an appointed administrator (every existing admin-only function keeps working unchanged)
create or replace function public.tc_is_admin(c text, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.tc_is_owner(c, k)
      or exists (select 1 from public.table_admins a where a.table_code = c and a.key_hash = public.tc_hash(k));
$$;

-- a new table code is for the owner only
create or replace function public.rotate_code(p_code text, p_key text, p_new text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := public.tc_clean(p_new);
begin
  if length(c) < 6 or length(n) < 6 then raise exception 'table code too short'; end if;
  if not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
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

-- the owner tells the app who they are
create or replace function public.set_owner_name(p_code text, p_key text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 or not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
  update public.family_tables set owner_name = left(btrim(coalesce(p_name, '')), 40) where table_code = c;
end $$;

-- everybody who knows the table code may see who its owner is (they already see the members' names)
create or replace function public.table_owner(p_code text) returns text
language sql stable security definer set search_path = public as $$
  select t.owner_name from public.family_tables t
   where length(public.tc_clean(p_code)) >= 6 and t.table_code = public.tc_clean(p_code);
$$;

-- who is owner and who is administrator, and which one is the asking device (admins only)
create or replace function public.table_roles(p_code text, p_key text)
returns table(name text, role text, me boolean)
language plpgsql stable security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 or not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  return query
    select coalesce(t.owner_name, ''), 'owner'::text, public.tc_is_owner(c, p_key)
      from public.family_tables t where t.table_code = c
    union all
    select a.name, 'admin'::text, (a.key_hash = public.tc_hash(p_key))
      from public.table_admins a where a.table_code = c;
end $$;

-- the owner makes a one-time link that appoints a person (valid 7 days)
create or replace function public.admin_grant_create(p_code text, p_key text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := left(btrim(coalesce(p_name, '')), 40);
        tok text := replace(gen_random_uuid()::text, '-', '');
begin
  if length(c) < 6 or not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
  if n = '' then raise exception 'name missing'; end if;
  insert into public.table_admin_grants (token_hash, table_code, name, expires_at)
  values (public.tc_hash(tok), c, n, now() + interval '7 days');
  return tok;
end $$;

-- the appointed person opens the link: their device key becomes an administrator key. Returns the name, or null.
create or replace function public.admin_grant_accept(p_code text, p_token text, p_key text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); g public.table_admin_grants;
begin
  if length(c) < 6 or length(coalesce(p_key, '')) < 12 then return null; end if;
  select * into g from public.table_admin_grants
   where token_hash = public.tc_hash(p_token) and table_code = c and not used and expires_at > now();
  if not found then return null; end if;
  update public.table_admin_grants set used = true where token_hash = g.token_hash;
  insert into public.table_admins (table_code, name, key_hash) values (c, g.name, public.tc_hash(p_key))
  on conflict (table_code, key_hash) do update set name = excluded.name;
  return g.name;
end $$;

-- the owner takes the administrator role away (every device that person used with that name)
create or replace function public.admin_remove(p_code text, p_key text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 or not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
  delete from public.table_admins where table_code = c and lower(name) = lower(btrim(coalesce(p_name, '')));
  delete from public.table_admin_grants where table_code = c and lower(name) = lower(btrim(coalesce(p_name, ''))) and not used;
end $$;

revoke all on function public.tc_move_admins()                       from public;
revoke all on function public.tc_is_owner(text, text)                from public;
revoke all on function public.rotate_code(text, text, text)          from public;
revoke all on function public.set_owner_name(text, text, text)       from public;
revoke all on function public.table_owner(text)                       from public;
revoke all on function public.table_roles(text, text)                from public;
revoke all on function public.admin_grant_create(text, text, text)   from public;
revoke all on function public.admin_grant_accept(text, text, text)   from public;
revoke all on function public.admin_remove(text, text, text)         from public;
grant execute on function public.rotate_code(text, text, text)       to anon, authenticated;
grant execute on function public.set_owner_name(text, text, text)    to anon, authenticated;
grant execute on function public.table_owner(text)                    to anon, authenticated;
grant execute on function public.table_roles(text, text)             to anon, authenticated;
grant execute on function public.admin_grant_create(text, text, text) to anon, authenticated;
grant execute on function public.admin_grant_accept(text, text, text) to anon, authenticated;
grant execute on function public.admin_remove(text, text, text)      to anon, authenticated;

commit;

-- CHECK: expected no rows (the two tables cannot be touched directly), then the owners and administrators.
select tablename, cmd, policyname from pg_policies where schemaname = 'public' and tablename in ('table_admins', 'table_admin_grants');
select table_code, owner_name, (select count(*) from public.table_admins a where a.table_code = t.table_code) as administrators from public.family_tables t;
