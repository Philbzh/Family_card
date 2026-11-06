-- ============================================================================
--  Our Table — AUDIT LOG AND SAFEGUARDS  (run AFTER supabase-admins.sql and supabase-masteradmin.sql)
--
--  WHAT THIS ADDS
--    * The access history (Settings -> Access & Security -> Access history) now ALSO records, written by the
--      server itself (the browser cannot falsify it):
--        - Administrator appointed (when the person accepts on their own device)
--        - Administrator removed
--        - Person removed from the table
--        - Table code changed
--      Each entry says which KIND of key acted (owner key, administrator key, MasterAdmin key). There are no accounts,
--      so it proves which key acted, not which real person held it.
--    * A server-side safeguard: the OWNER of a table cannot be removed from its member list.
--
--  HOW TO RUN: Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
--  UNDO: supabase-audit-undo.sql
-- ============================================================================

begin;

-- which kind of key is this (in words, for the history)
create or replace function public.tc_actor(c text, k text) returns text
language sql stable security definer set search_path = public as $$
  select case
           when public.tc_is_master(k) then 'MasterAdmin key'
           when public.tc_is_owner(c, k) then 'owner key'
           when public.tc_is_admin(c, k) then 'administrator key'
           else 'no administrator key'
         end;
$$;

-- remove a person from a table: logged, and the owner cannot be removed (keeps the invitations-only gate in front)
create or replace function public.remove_member(p_code text, p_name text, p_key text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_gate(p_code); n text := left(btrim(coalesce(p_name, '')), 40); o text;
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if public.tc_has_admin(c) and not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  if n = '' then return; end if;
  select t.owner_name into o from public.family_tables t where t.table_code = c;
  if o is not null and lower(o) = lower(n) then raise exception 'the owner cannot be removed'; end if;
  insert into public.family_members (table_code, name_key, name, deleted, updated_at)
  values (c, lower(n), n, true, now())
  on conflict (table_code, name_key) do update set deleted = true, updated_at = now();
  perform public.tc_log(c, 'person_removed', null, n, 'by ' || public.tc_actor(c, p_key));
end $$;

-- a new table code: logged under the new code (the history moves with the table)
create or replace function public.rotate_code(p_code text, p_key text, p_new text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); n text := public.tc_clean(p_new); who text;
begin
  if length(c) < 6 or length(n) < 6 then raise exception 'table code too short'; end if;
  if not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
  if exists (select 1 from public.family_tables where table_code = n)
     or exists (select 1 from public.family_members where table_code = n)
     or exists (select 1 from public.family_settings where table_code = n)
     or exists (select 1 from public.game_history where table_code = n) then
    raise exception 'that code is already in use';
  end if;
  who := public.tc_actor(c, p_key);
  update public.game_history   set table_code = n where table_code = c;
  update public.family_members set table_code = n where table_code = c;
  update public.family_settings set table_code = n where table_code = c;
  update public.family_tables  set table_code = n where table_code = c;
  perform public.tc_log(n, 'code_changed', null, null, 'by ' || who);
  return n;
end $$;

-- an administrator is appointed: logged when the person accepts
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
  perform public.tc_log(c, 'admin_appointed', null, g.name, 'accepted on their own device');
  return g.name;
end $$;

-- an administrator is removed: logged
create or replace function public.admin_remove(p_code text, p_key text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code); who text;
begin
  if length(c) < 6 or not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
  who := public.tc_actor(c, p_key);
  delete from public.table_admins where table_code = c and lower(name) = lower(btrim(coalesce(p_name, '')));
  delete from public.table_admin_grants where table_code = c and lower(name) = lower(btrim(coalesce(p_name, ''))) and not used;
  perform public.tc_log(c, 'admin_removed', null, left(btrim(coalesce(p_name, '')), 40), 'by ' || who);
end $$;

revoke all on function public.tc_actor(text, text) from public;

commit;

-- CHECK: the four functions now write to the history; this lists the newest entries of every table.
select table_code, at, event, label, detail from public.table_access_log order by at desc limit 10;
