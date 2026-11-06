-- ============================================================================
--  Undo supabase-audit.sql: back to the functions without the extra history entries and the owner safeguard.
-- ============================================================================
begin;

create or replace function public.remove_member(p_code text, p_name text, p_key text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_gate(p_code); n text := left(btrim(coalesce(p_name, '')), 40);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  if public.tc_has_admin(c) and not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  if n = '' then return; end if;
  insert into public.family_members (table_code, name_key, name, deleted, updated_at)
  values (c, lower(n), n, true, now())
  on conflict (table_code, name_key) do update set deleted = true, updated_at = now();
end $$;

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

create or replace function public.admin_remove(p_code text, p_key text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 or not public.tc_is_owner(c, p_key) then raise exception 'owner only'; end if;
  delete from public.table_admins where table_code = c and lower(name) = lower(btrim(coalesce(p_name, '')));
  delete from public.table_admin_grants where table_code = c and lower(name) = lower(btrim(coalesce(p_name, ''))) and not used;
end $$;

drop function if exists public.tc_actor(text, text);

commit;
