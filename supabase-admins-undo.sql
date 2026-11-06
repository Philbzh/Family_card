-- ============================================================================
--  Undo supabase-admins.sql: back to ONE admin (the owner) per table.
--  Administrators who were appointed lose that role; the owner is not affected.
-- ============================================================================
begin;

drop function if exists public.admin_remove(text, text, text);
drop function if exists public.admin_grant_accept(text, text, text);
drop function if exists public.admin_grant_create(text, text, text);
drop function if exists public.table_roles(text, text);
drop function if exists public.table_owner(text);
drop function if exists public.set_owner_name(text, text, text);

-- the admin check goes back to the owner only
create or replace function public.tc_is_admin(c text, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_tables t
                  where t.table_code = c and t.admin_hash is not null and t.admin_hash = public.tc_hash(k));
$$;

-- a new code is for any admin again (as before)
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

drop trigger if exists tc_move_admins_trigger on public.family_tables;
drop function if exists public.tc_move_admins();
drop function if exists public.tc_is_owner(text, text);
drop table if exists public.table_admin_grants;
drop table if exists public.table_admins;
alter table public.family_tables drop column if exists owner_name;

commit;
