-- Our Table — UNDO of supabase-invites.sql: the table code alone opens a table again, as before.
-- (The invitation, device and log tables stay, unused. Drop them by hand if you want them gone.)
begin;

update public.family_tables set invite_only = false;

do $$
declare f record; def text;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace s on s.oid = p.pronamespace
     where s.nspname = 'public'
       and p.proname in ('add_history', 'history_for', 'history_since', 'members_for', 'upsert_member',
                         'remove_member', 'settings_for', 'set_settings', 'set_favourites')
  loop
    def := pg_get_functiondef(f.sig);
    execute replace(def, 'public.tc_gate(p_code)', 'public.tc_clean(p_code)');
  end loop;
end $$;

drop function if exists public.table_info(text);
create or replace function public.table_info(p_code text)
returns table(has_admin boolean, name text)
language sql stable security definer set search_path = public as $$
  select (t.admin_hash is not null), t.name from public.family_tables t
   where length(public.tc_clean(p_code)) >= 6 and t.table_code = public.tc_clean(p_code);
$$;
revoke all on function public.table_info(text) from public;
grant execute on function public.table_info(text) to anon, authenticated;

drop function if exists public.enroll_admin(text, text, text);
drop function if exists public.set_invite_only(text, text, boolean);
drop function if exists public.invite_create(text, text, int, int, int, text);
drop function if exists public.invite_revoke(text, text, text);
drop function if exists public.invite_delete(text, text, text);
drop function if exists public.invite_list(text, text);
drop function if exists public.device_list(text, text);
drop function if exists public.device_set_status(text, text, uuid, text);
drop function if exists public.device_set_until(text, text, uuid, timestamptz);
drop function if exists public.device_remove(text, text, uuid);
drop function if exists public.access_log_list(text, text, int);
drop function if exists public.claim_invite(text, text, text);
drop function if exists public.device_ping(text);
drop function if exists public.tc_gate(text);

commit;
