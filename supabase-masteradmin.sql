-- ============================================================================
--  Our Table — THE MASTERADMIN  (run AFTER supabase-admins.sql)
--
--  WHAT THIS ADDS
--    * ONE person above all tables: the MASTERADMIN. The MasterAdmin has every right of an owner on EVERY table
--      (existing and future): people, administrators, invitations, devices, a new table code.
--    * An overview of ALL tables (name, owner, people, administrators, games, last used) for the MasterAdmin only.
--    * Below it nothing changes: every table keeps its own owner, and the owner can appoint administrators.
--
--  HOW THE MASTERADMIN WORKS (it can never be lost, and nobody can take it by surprise)
--    1. Before you run this file, REPLACE  PUT-YOUR-OWN-SETUP-CODE-HERE  below by a RECOVERY CODE that only you
--       know (about 16 letters and digits). Do not leave the placeholder, and do not save your real code in a file
--       that is uploaded to GitHub. Keep it in a password manager.
--    2. Run this whole file once in Supabase -> SQL Editor.
--    3. In any browser: Settings -> Account & sync -> "MasterAdmin sign-in", type the recovery code. That browser
--       is MasterAdmin from then on (the database keeps only a fingerprint of its key). You can do this on as many
--       browsers as you like, and again after clearing a browser or getting a new device: the rights cannot disappear.
--    4. The MasterAdmin can change the recovery code, and can sign out all its other browsers.
--
--  UNDO: supabase-masteradmin-undo.sql
-- ============================================================================

begin;

create table if not exists public.site_admins (
  key_hash   text primary key,
  name       text,
  created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;

create table if not exists public.site_setup (
  id        int primary key default 1 check (id = 1),
  code_hash text not null,
  used      boolean not null default false
);
alter table public.site_setup enable row level security;
-- no policies on these two tables: nobody can touch them directly, only the functions below

insert into public.site_setup (id, code_hash)
values (1, public.tc_hash('PUT-YOUR-OWN-SETUP-CODE-HERE'))
on conflict (id) do nothing;

create or replace function public.tc_is_master(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_admins s where s.key_hash = public.tc_hash(k));
$$;

-- the MasterAdmin counts as the owner of every table (and so as an administrator too)
create or replace function public.tc_is_owner(c text, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.tc_is_master(k)
      or exists (select 1 from public.family_tables t
                  where t.table_code = c and t.admin_hash is not null and t.admin_hash = public.tc_hash(k));
$$;

-- is there a MasterAdmin yet? (open: the app only shows the setup button while there is none)
create or replace function public.site_has_master() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_admins);
$$;

-- sign in with the recovery code: this browser's key becomes a MasterAdmin key. Works at any time, in any browser.
create or replace function public.master_claim(p_setup text, p_key text, p_name text)
returns boolean language plpgsql security definer set search_path = public as $$
declare s public.site_setup;
begin
  if length(coalesce(p_key, '')) < 12 then return false; end if;
  select * into s from public.site_setup where id = 1;
  if not found or s.code_hash <> public.tc_hash(p_setup) or p_setup = 'PUT-YOUR-OWN-SETUP-CODE-HERE' then return false; end if;
  insert into public.site_admins (key_hash, name) values (public.tc_hash(p_key), left(btrim(coalesce(p_name, '')), 40))
  on conflict (key_hash) do update set name = excluded.name;
  return true;
end $$;

-- the MasterAdmin changes the recovery code
create or replace function public.master_change_code(p_key text, p_new text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.tc_is_master(p_key) then raise exception 'master only'; end if;
  if length(coalesce(p_new, '')) < 12 or p_new = 'PUT-YOUR-OWN-SETUP-CODE-HERE' then return false; end if;
  update public.site_setup set code_hash = public.tc_hash(p_new) where id = 1;
  return true;
end $$;

-- the MasterAdmin signs out every other browser (their keys stop working); returns how many were removed
create or replace function public.master_revoke_others(p_key text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.tc_is_master(p_key) then raise exception 'master only'; end if;
  delete from public.site_admins where key_hash <> public.tc_hash(p_key);
  get diagnostics n = row_count;
  return n;
end $$;

-- does this key belong to the MasterAdmin?
create or replace function public.master_status(p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.tc_is_master(p_key);
$$;

-- every table at a glance (MasterAdmin only)
create or replace function public.master_tables(p_key text)
returns table(code text, name text, owner_name text, invite_only boolean, has_owner boolean, admins int, people int, games int, last_played timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.tc_is_master(p_key) then raise exception 'master only'; end if;
  return query
    with codes as (
      select ft.table_code from public.family_tables ft
      union select fm.table_code from public.family_members fm
      union select fs.table_code from public.family_settings fs
      union select gh.table_code from public.game_history gh where gh.table_code is not null
    )
    select c.table_code,
           coalesce(nullif(t.name, ''), s.table_name, '')::text,
           t.owner_name::text,
           coalesce(t.invite_only, false),
           (t.admin_hash is not null),
           (select count(*) from public.table_admins a where a.table_code = c.table_code)::int,
           (select count(*) from public.family_members m where m.table_code = c.table_code and not m.deleted)::int,
           (select count(*) from public.game_history g where g.table_code = c.table_code)::int,
           (select max(g.played_at) from public.game_history g where g.table_code = c.table_code)::timestamptz
      from codes c
      left join public.family_tables t on t.table_code = c.table_code
      left join public.family_settings s on s.table_code = c.table_code
     order by 9 desc nulls last, 2;
end $$;

revoke all on function public.tc_is_master(text)                     from public;
revoke all on function public.tc_is_owner(text, text)                from public;
revoke all on function public.site_has_master()                      from public;
revoke all on function public.master_claim(text, text, text)         from public;
revoke all on function public.master_status(text)                    from public;
revoke all on function public.master_change_code(text, text)         from public;
revoke all on function public.master_revoke_others(text)             from public;
revoke all on function public.master_tables(text)                    from public;
grant execute on function public.site_has_master()                   to anon, authenticated;
grant execute on function public.master_claim(text, text, text)      to anon, authenticated;
grant execute on function public.master_status(text)                to anon, authenticated;
grant execute on function public.master_change_code(text, text)     to anon, authenticated;
grant execute on function public.master_revoke_others(text)         to anon, authenticated;
grant execute on function public.master_tables(text)                 to anon, authenticated;

commit;

-- CHECK: no rows (the tables cannot be touched directly), then whether a MasterAdmin exists (false until you set it up).
select tablename, cmd, policyname from pg_policies where schemaname = 'public' and tablename in ('site_admins', 'site_setup');
select public.site_has_master() as masteradmin_exists;
