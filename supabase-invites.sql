-- ============================================================================
--  Our Table — PERSONAL INVITATIONS, DEVICE ACCESS AND AN ACCESS LOG
--  (run AFTER supabase-family-sync.sql, supabase-favourites.sql and supabase-tables-admin.sql)
--
--  THE PROBLEM THIS SOLVES
--    Until now anybody who knew a table's code was in for good: the code could be passed on from person to
--    person, and the admin could not see who was in, or cut one person off (only change the code for everybody).
--
--  WHAT THIS ADDS (nothing changes until the admin of a table switches "Invitations only" on)
--    * INVITATIONS: the admin makes invitation links with a number of uses (1 = single use), a last day, and
--      optionally an end date for the access they give. An invitation can be revoked or deleted.
--    * DEVICES: whoever uses an invitation gets a private key for their own device (the database keeps only a
--      fingerprint). Forwarding the link does not help: after the last use it opens nothing.
--    * With "Invitations only" ON, the table code alone opens NOTHING: every request must carry a device key
--      that is active and not past its end date. The admin can suspend, reactivate or remove a device and the
--      effect is immediate (no session or cache outlives it).
--    * ACCESS LOG: who joined with which invitation, refused tries, revocations, suspensions, removals.
--
--  HOW TO RUN: Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
--  TO UNDO: run supabase-invites-undo.sql.
-- ============================================================================

begin;

alter table public.family_tables add column if not exists invite_only boolean not null default false;

create table if not exists public.table_devices (
  device_id    uuid primary key default gen_random_uuid(),
  table_code   text not null,
  label        text,
  token_hash   text not null,
  status       text not null default 'active' check (status in ('active', 'suspended')),
  is_admin     boolean not null default false,
  joined_at    timestamptz not null default now(),
  last_seen_at timestamptz,
  invite_code  text,
  access_until timestamptz
);
create index if not exists table_devices_code_idx on public.table_devices (table_code);
create index if not exists table_devices_hash_idx on public.table_devices (token_hash);
alter table public.table_devices enable row level security;

create table if not exists public.table_invites (
  code        text primary key,
  table_code  text not null,
  label       text,
  max_uses    int  not null default 1,
  use_count   int  not null default 0,
  expires_at  timestamptz not null,
  access_days int,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists table_invites_code_idx on public.table_invites (table_code);
alter table public.table_invites enable row level security;

create table if not exists public.table_access_log (
  id         bigint generated always as identity primary key,
  table_code text not null,
  at         timestamptz not null default now(),
  event      text not null,
  invite     text,
  label      text,
  detail     text
);
create index if not exists table_access_log_idx on public.table_access_log (table_code, at desc);
alter table public.table_access_log enable row level security;
-- no policies on the three tables: nobody can touch them directly, only the functions below

-- the table code moves (rotate_code): invitations, devices and log move with it
create or replace function public.tc_move_access() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.table_code <> old.table_code then
    update public.table_devices    set table_code = new.table_code where table_code = old.table_code;
    update public.table_invites    set table_code = new.table_code where table_code = old.table_code;
    update public.table_access_log set table_code = new.table_code where table_code = old.table_code;
  end if;
  return new;
end $$;
drop trigger if exists tc_move_access_trigger on public.family_tables;
create trigger tc_move_access_trigger after update of table_code on public.family_tables
  for each row execute function public.tc_move_access();

create or replace function public.tc_log(c text, ev text, inv text, lbl text, det text) returns void
language sql security definer set search_path = public as $$
  insert into public.table_access_log (table_code, event, invite, label, detail) values (c, ev, inv, lbl, det);
$$;

-- the device key of this request. It travels inside the x-client-info header (a header that browsers may always send).
create or replace function public.tc_token() returns text
language plpgsql stable as $$
declare h text := coalesce(current_setting('request.headers', true), '');
begin
  if h = '' then return null; end if;
  return substring((h::json ->> 'x-client-info') from 'ct-dev/([0-9a-f]{64})');
exception when others then return null;
end $$;

create or replace function public.tc_device_ok(c text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.table_devices d
     where d.table_code = c and d.status = 'active'
       and (d.access_until is null or d.access_until > now())
       and d.token_hash = public.tc_hash(public.tc_token())
  );
$$;

-- THE GATE. Cleans the code like tc_clean does; on a table that is "invitations only" it also demands an active device key.
create or replace function public.tc_gate(p text) returns text
language plpgsql stable security definer set search_path = public as $$
declare c text := public.tc_clean(p);
begin
  if length(c) < 6 then return c; end if;
  if not exists (select 1 from public.family_tables t where t.table_code = c and t.invite_only) then return c; end if;
  if public.tc_device_ok(c) then return c; end if;
  raise exception 'access denied';
end $$;

-- put the gate in front of every function that reads or writes a table's data
do $$
declare f record; def text; fixed text; n int := 0;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace s on s.oid = p.pronamespace
     where s.nspname = 'public'
       and p.proname in ('add_history', 'history_for', 'history_since', 'members_for', 'upsert_member',
                         'remove_member', 'settings_for', 'set_settings', 'set_favourites')
  loop
    def := pg_get_functiondef(f.sig);
    fixed := replace(def, 'public.tc_clean(p_code)', 'public.tc_gate(p_code)');
    fixed := replace(fixed, $r$regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g')$r$, 'public.tc_gate(p_code)');
    if fixed = def then
      if position('tc_gate' in def) = 0 then raise exception 'cannot put the gate in front of %', f.sig; end if;
    else
      execute fixed;
      n := n + 1;
    end if;
  end loop;
  if n = 0 then raise notice 'the gate was already in place'; end if;
end $$;

-- does the table have an admin, what is it called, and is it invitations-only? (open to everybody: the join screen needs it)
drop function if exists public.table_info(text);
create or replace function public.table_info(p_code text)
returns table(has_admin boolean, name text, invite_only boolean)
language sql stable security definer set search_path = public as $$
  select (t.admin_hash is not null), t.name, t.invite_only from public.family_tables t
   where length(public.tc_clean(p_code)) >= 6 and t.table_code = public.tc_clean(p_code);
$$;

-- ---------------------------------------------------------------- admin: switch, invitations, devices, log
create or replace function public.tc_admin(p_code text, p_key text) returns text
language plpgsql stable security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if length(c) < 6 or not public.tc_is_admin(c, p_key) then raise exception 'admin only'; end if;
  return c;
end $$;

-- the admin's own device gets a key (so the admin is never locked out by the switch below)
create or replace function public.enroll_admin(p_code text, p_key text, p_label text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key); tok text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  insert into public.table_devices (table_code, label, token_hash, is_admin)
    values (c, left(coalesce(nullif(btrim(p_label), ''), 'Admin'), 40), public.tc_hash(tok), true);
  perform public.tc_log(c, 'admin_device', null, left(coalesce(p_label, ''), 40), null);
  return tok;
end $$;

create or replace function public.set_invite_only(p_code text, p_key text, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key);
begin
  if p_on and not exists (select 1 from public.table_devices where table_code = c and is_admin and status = 'active') then
    raise exception 'enroll the admin device first';
  end if;
  update public.family_tables set invite_only = p_on where table_code = c;
  perform public.tc_log(c, case when p_on then 'invitations_only_on' else 'invitations_only_off' end, null, null, null);
end $$;

create or replace function public.invite_create(p_code text, p_key text, p_uses int default 1, p_valid_days int default 7,
                                                p_access_days int default null, p_label text default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key); inv text;
begin
  if p_uses is null or p_uses < 1 or p_uses > 50 then raise exception 'uses must be 1 to 50'; end if;
  if p_valid_days is null or p_valid_days < 1 or p_valid_days > 90 then raise exception 'valid days must be 1 to 90'; end if;
  if p_access_days is not null and (p_access_days < 1 or p_access_days > 730) then raise exception 'access days must be 1 to 730'; end if;
  inv := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.table_invites (code, table_code, label, max_uses, expires_at, access_days)
    values (inv, c, left(nullif(btrim(p_label), ''), 40), p_uses, now() + make_interval(days => p_valid_days), p_access_days);
  perform public.tc_log(c, 'invite_created', inv, left(p_label, 40),
    p_uses || ' use(s), valid ' || p_valid_days || ' days' || coalesce(', access ' || p_access_days || ' days', ''));
  return inv;
end $$;

create or replace function public.invite_revoke(p_code text, p_key text, p_invite text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key);
begin
  update public.table_invites set revoked_at = now() where table_code = c and code = upper(p_invite) and revoked_at is null;
  if found then perform public.tc_log(c, 'invite_revoked', upper(p_invite), null, null); end if;
end $$;

create or replace function public.invite_delete(p_code text, p_key text, p_invite text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key);
begin
  delete from public.table_invites where table_code = c and code = upper(p_invite);
  if found then perform public.tc_log(c, 'invite_deleted', upper(p_invite), null, null); end if;
end $$;

create or replace function public.invite_list(p_code text, p_key text)
returns table(code text, label text, max_uses int, use_count int, expires_at timestamptz, access_days int, revoked_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key);
begin
  return query select i.code, i.label, i.max_uses, i.use_count, i.expires_at, i.access_days, i.revoked_at, i.created_at
                 from public.table_invites i where i.table_code = c order by i.created_at desc;
end $$;

create or replace function public.device_list(p_code text, p_key text)
returns table(device_id uuid, label text, status text, is_admin boolean, joined_at timestamptz, last_seen_at timestamptz, invite_code text, access_until timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key);
begin
  return query select d.device_id, d.label, d.status, d.is_admin, d.joined_at, d.last_seen_at, d.invite_code, d.access_until
                 from public.table_devices d where d.table_code = c order by d.joined_at;
end $$;

create or replace function public.device_set_status(p_code text, p_key text, p_device uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key); d public.table_devices;
begin
  if p_status not in ('active', 'suspended') then raise exception 'invalid status'; end if;
  update public.table_devices set status = p_status where table_code = c and device_id = p_device returning * into d;
  if found then perform public.tc_log(c, case when p_status = 'suspended' then 'suspended' else 'reactivated' end, d.invite_code, d.label, null); end if;
end $$;

create or replace function public.device_set_until(p_code text, p_key text, p_device uuid, p_until timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key); d public.table_devices;
begin
  update public.table_devices set access_until = p_until where table_code = c and device_id = p_device returning * into d;
  if found then perform public.tc_log(c, 'end_date_set', d.invite_code, d.label, coalesce(p_until::text, 'none')); end if;
end $$;

create or replace function public.device_remove(p_code text, p_key text, p_device uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key); d public.table_devices;
begin
  delete from public.table_devices where table_code = c and device_id = p_device returning * into d;
  if found then perform public.tc_log(c, 'removed', d.invite_code, d.label, null); end if;
end $$;

create or replace function public.access_log_list(p_code text, p_key text, p_limit int default 200)
returns table(at timestamptz, event text, invite text, label text, detail text)
language plpgsql stable security definer set search_path = public as $$
declare c text := public.tc_admin(p_code, p_key);
begin
  return query select l.at, l.event, l.invite, l.label, l.detail from public.table_access_log l
                where l.table_code = c order by l.at desc, l.id desc limit least(greatest(coalesce(p_limit, 200), 1), 500);
end $$;

-- ---------------------------------------------------------------- a guest: claim an invitation, say "I am here"
create or replace function public.claim_invite(p_code text, p_invite text, p_label text)
returns text language plpgsql security definer set search_path = public as $$
declare
  c text := public.tc_clean(p_code); i public.table_invites; tok text; why text; lbl text := left(btrim(coalesce(p_label, '')), 40);
begin
  if length(c) < 6 then raise exception 'table code too short'; end if;
  -- a table cannot be probed: after 15 refused tries in an hour, nothing is accepted for an hour
  if (select count(*) from public.table_access_log where table_code = c and event = 'claim_refused' and at > now() - interval '1 hour') >= 15 then
    return null;
  end if;
  select * into i from public.table_invites where table_code = c and code = upper(btrim(coalesce(p_invite, ''))) for update;
  if not found then
    perform public.tc_log(c, 'claim_refused', null, lbl, 'unknown code');
    return null;
  end if;
  why := case
    when i.revoked_at is not null then 'invitation was revoked'
    when i.expires_at <= now() then 'invitation expired'
    when i.use_count >= i.max_uses then 'invitation already used up'
  end;
  if why is not null then
    perform public.tc_log(c, 'claim_refused', i.code, lbl, why);
    return null;
  end if;
  tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.table_devices (table_code, label, token_hash, invite_code, access_until)
    values (c, nullif(lbl, ''), public.tc_hash(tok), i.code,
            case when i.access_days is not null then now() + make_interval(days => i.access_days) end);
  update public.table_invites set use_count = use_count + 1 where code = i.code;
  perform public.tc_log(c, 'joined', i.code, lbl, null);
  return tok;
end $$;

-- (a refused claim answers NULL instead of an error, so that the refusal stays in the log)
-- "I am here": remembers when this device was last active (at most every 5 minutes). Returns false when it has no access.
create or replace function public.device_ping(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := public.tc_clean(p_code);
begin
  if public.tc_token() is null then return false; end if;
  update public.table_devices set last_seen_at = now()
   where table_code = c and token_hash = public.tc_hash(public.tc_token()) and status = 'active'
     and (access_until is null or access_until > now())
     and (last_seen_at is null or last_seen_at < now() - interval '5 minutes');
  return public.tc_device_ok(c);
end $$;

revoke all on function public.tc_move_access()                                   from public;
revoke all on function public.tc_log(text, text, text, text, text)               from public;
revoke all on function public.tc_token()                                         from public;
revoke all on function public.tc_device_ok(text)                                 from public;
revoke all on function public.tc_gate(text)                                      from public;
revoke all on function public.tc_admin(text, text)                               from public;
revoke all on function public.table_info(text)                                   from public;
revoke all on function public.enroll_admin(text, text, text)                     from public;
revoke all on function public.set_invite_only(text, text, boolean)               from public;
revoke all on function public.invite_create(text, text, int, int, int, text)     from public;
revoke all on function public.invite_revoke(text, text, text)                    from public;
revoke all on function public.invite_delete(text, text, text)                    from public;
revoke all on function public.invite_list(text, text)                            from public;
revoke all on function public.device_list(text, text)                            from public;
revoke all on function public.device_set_status(text, text, uuid, text)          from public;
revoke all on function public.device_set_until(text, text, uuid, timestamptz)    from public;
revoke all on function public.device_remove(text, text, uuid)                    from public;
revoke all on function public.access_log_list(text, text, int)                   from public;
revoke all on function public.claim_invite(text, text, text)                     from public;
revoke all on function public.device_ping(text)                                  from public;
grant execute on function public.table_info(text)                                to anon, authenticated;
grant execute on function public.enroll_admin(text, text, text)                  to anon, authenticated;
grant execute on function public.set_invite_only(text, text, boolean)            to anon, authenticated;
grant execute on function public.invite_create(text, text, int, int, int, text)  to anon, authenticated;
grant execute on function public.invite_revoke(text, text, text)                 to anon, authenticated;
grant execute on function public.invite_delete(text, text, text)                 to anon, authenticated;
grant execute on function public.invite_list(text, text)                         to anon, authenticated;
grant execute on function public.device_list(text, text)                         to anon, authenticated;
grant execute on function public.device_set_status(text, text, uuid, text)       to anon, authenticated;
grant execute on function public.device_set_until(text, text, uuid, timestamptz)  to anon, authenticated;
grant execute on function public.device_remove(text, text, uuid)                 to anon, authenticated;
grant execute on function public.access_log_list(text, text, int)                to anon, authenticated;
grant execute on function public.claim_invite(text, text, text)                  to anon, authenticated;
grant execute on function public.device_ping(text)                               to anon, authenticated;

commit;

-- CHECK: expected no rows (the access tables cannot be touched directly)
select tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('table_devices', 'table_invites', 'table_access_log');
