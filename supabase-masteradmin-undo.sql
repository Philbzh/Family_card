-- ============================================================================
--  Undo supabase-masteradmin.sql: there is no MasterAdmin any more; every table keeps its own owner.
-- ============================================================================
begin;

drop function if exists public.master_tables(text);
drop function if exists public.master_revoke_others(text);
drop function if exists public.master_change_code(text, text);
drop function if exists public.master_status(text);
drop function if exists public.master_claim(text, text, text);
drop function if exists public.site_has_master();

-- the owner check goes back to the table's own admin key
create or replace function public.tc_is_owner(c text, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_tables t
                  where t.table_code = c and t.admin_hash is not null and t.admin_hash = public.tc_hash(k));
$$;

drop function if exists public.tc_is_master(text);
drop table if exists public.site_setup;
drop table if exists public.site_admins;

commit;

-- To start over with a NEW MasterAdmin (for example the key was lost): run this undo file, then supabase-masteradmin.sql again.
