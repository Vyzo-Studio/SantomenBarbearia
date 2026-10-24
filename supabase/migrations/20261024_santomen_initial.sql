-- Santomen Barbearia: isolated schema, version 1.
-- Apply ONLY to a new independent Supabase project dedicated to Santomen.
-- Safe to review before applying. Do NOT run in GNG or HAUS databases.
-- The owner must provision an auth.users account, then insert its UUID in santomen_admins.
create extension if not exists pgcrypto;
create schema if not exists santomen_private;
revoke all on schema santomen_private from public;
grant usage on schema santomen_private to authenticated;

create table if not exists public.santomen_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.santomen_settings (
  id integer primary key default 1 check (id=1),
  name text not null default 'Santomen Barbearia',
  address text not null default 'QNM 20, Conjunto A, Lote 45 — Ceilândia, Brasília/DF',
  whatsapp text not null default '5561992232839',
  opening time not null default '08:30',
  closing time not null default '20:00',
  working_days integer[] not null default array[1,2,3,4,5,6],
  step_minutes integer not null default 30 check(step_minutes between 10 and 60),
  updated_at timestamptz not null default now()
);
insert into public.santomen_settings(id) values (1) on conflict(id) do nothing;

create table if not exists public.santomen_services (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 2 and 100),
  description text not null default '',
  category text not null default 'Cortes',
  price_cents integer not null check(price_cents between 0 and 10000000),
  duration_minutes integer not null check(duration_minutes between 10 and 300),
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.santomen_barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 2 and 100),
  bio text not null default '',
  photo_url text,
  is_active boolean not null default false,
  working_days integer[] not null default array[1,2,3,4,5,6],
  opening time not null default '08:30',
  closing time not null default '20:00',
  created_at timestamptz not null default now()
);
create table if not exists public.santomen_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.santomen_barbers(id) on delete cascade,
  block_date date not null,
  starts_at time not null,
  ends_at time not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint santomen_blocks_valid check(ends_at>starts_at)
);
create table if not exists public.santomen_bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.santomen_services(id),
  barber_id uuid not null references public.santomen_barbers(id),
  booking_date date not null,
  starts_at time not null,
  ends_at time not null,
  customer_name text not null check(char_length(customer_name) between 2 and 90),
  phone text not null check(phone ~ '^[1-9][0-9]9[0-9]{8}$|^[1-9][0-9][2-8][0-9]{7}$'),
  price_snapshot_cents integer not null check(price_snapshot_cents>=0),
  duration_snapshot_minutes integer not null check(duration_snapshot_minutes between 10 and 300),
  status text not null default 'pending' check(status in ('pending','confirmed','completed','cancelled','rejected','expired')),
  source text not null default 'online' check(source in ('online','manual','whatsapp','telephone','in_person')),
  privacy_accepted boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint santomen_booking_interval check(ends_at>starts_at)
);
create index if not exists santomen_bookings_schedule on public.santomen_bookings(barber_id,booking_date,starts_at,ends_at);
create index if not exists santomen_bookings_pending on public.santomen_bookings(phone,created_at) where status='pending';
create table if not exists public.santomen_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cents integer not null default 0 check(opening_cents>=0),
  closing_counted_cents integer check(closing_counted_cents>=0),
  opened_by uuid not null references auth.users(id),
  closed_by uuid references auth.users(id),
  constraint santomen_cash_close_valid check(closed_at is null or closed_at>=opened_at)
);
create unique index if not exists santomen_cash_single_open on public.santomen_cash_sessions((true)) where closed_at is null;
create table if not exists public.santomen_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.santomen_bookings(id),
  session_id uuid not null references public.santomen_cash_sessions(id),
  amount_cents integer not null check(amount_cents>=0),
  paid_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);
create table if not exists public.santomen_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.santomen_payments(id),
  method text not null check(method in ('cash','pix','debit','credit')),
  amount_cents integer not null check(amount_cents>0),
  unique(payment_id,method)
);
create table if not exists public.santomen_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.santomen_payments(id),
  amount_cents integer not null check(amount_cents>0),
  reason text not null,
  refunded_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);
create table if not exists public.santomen_media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Cortes',
  image_url text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
-- RLS is mandatory even when table grants are narrowed.
alter table public.santomen_admins enable row level security;
alter table public.santomen_settings enable row level security;
alter table public.santomen_services enable row level security;
alter table public.santomen_barbers enable row level security;
alter table public.santomen_blocks enable row level security;
alter table public.santomen_bookings enable row level security;
alter table public.santomen_cash_sessions enable row level security;
alter table public.santomen_payments enable row level security;
alter table public.santomen_payment_allocations enable row level security;
alter table public.santomen_refunds enable row level security;
alter table public.santomen_media enable row level security;
create or replace function santomen_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.santomen_admins a where a.user_id=(select auth.uid()));
$$;
revoke all on function santomen_private.is_admin() from public;
grant execute on function santomen_private.is_admin() to authenticated;
drop policy if exists santomen_admin_self on public.santomen_admins;
create policy santomen_admin_self on public.santomen_admins for select to authenticated using(user_id=(select auth.uid()));
-- Admin can manage catalog and business configuration, never modify immutable payment records directly.
drop policy if exists santomen_settings_admin on public.santomen_settings;
create policy santomen_settings_admin on public.santomen_settings for all to authenticated using(santomen_private.is_admin()) with check(santomen_private.is_admin());
drop policy if exists santomen_services_admin on public.santomen_services;
create policy santomen_services_admin on public.santomen_services for all to authenticated using(santomen_private.is_admin()) with check(santomen_private.is_admin());
drop policy if exists santomen_barbers_admin on public.santomen_barbers;
create policy santomen_barbers_admin on public.santomen_barbers for all to authenticated using(santomen_private.is_admin()) with check(santomen_private.is_admin());
drop policy if exists santomen_blocks_admin on public.santomen_blocks;
create policy santomen_blocks_admin on public.santomen_blocks for all to authenticated using(santomen_private.is_admin()) with check(santomen_private.is_admin());
drop policy if exists santomen_bookings_admin_read on public.santomen_bookings;
create policy santomen_bookings_admin_read on public.santomen_bookings for select to authenticated using(santomen_private.is_admin());
drop policy if exists santomen_bookings_admin_update on public.santomen_bookings;
create policy santomen_bookings_admin_update on public.santomen_bookings for update to authenticated using(santomen_private.is_admin()) with check(santomen_private.is_admin());
drop policy if exists santomen_cash_admin_read on public.santomen_cash_sessions;
create policy santomen_cash_admin_read on public.santomen_cash_sessions for select to authenticated using(santomen_private.is_admin());
drop policy if exists santomen_payments_admin_read on public.santomen_payments;
create policy santomen_payments_admin_read on public.santomen_payments for select to authenticated using(santomen_private.is_admin());
drop policy if exists santomen_allocations_admin_read on public.santomen_payment_allocations;
create policy santomen_allocations_admin_read on public.santomen_payment_allocations for select to authenticated using(santomen_private.is_admin());
drop policy if exists santomen_refunds_admin_read on public.santomen_refunds;
create policy santomen_refunds_admin_read on public.santomen_refunds for select to authenticated using(santomen_private.is_admin());
drop policy if exists santomen_media_admin on public.santomen_media;
create policy santomen_media_admin on public.santomen_media for all to authenticated using(santomen_private.is_admin()) with check(santomen_private.is_admin());
grant select on public.santomen_admins,public.santomen_settings,public.santomen_services,public.santomen_barbers,public.santomen_blocks,public.santomen_bookings,public.santomen_cash_sessions,public.santomen_payments,public.santomen_payment_allocations,public.santomen_refunds,public.santomen_media to authenticated;
grant insert,update,delete on public.santomen_settings,public.santomen_services,public.santomen_barbers,public.santomen_blocks,public.santomen_media to authenticated;
grant update(status,updated_at) on public.santomen_bookings to authenticated;
revoke all on public.santomen_admins,public.santomen_settings,public.santomen_services,public.santomen_barbers,public.santomen_blocks,public.santomen_bookings,public.santomen_cash_sessions,public.santomen_payments,public.santomen_payment_allocations,public.santomen_refunds,public.santomen_media from anon;
-- Internal overlap function; not exposed through public API.
create or replace function santomen_private.is_slot_free(p_barber uuid,p_date date,p_start time,p_duration integer)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare v_end timestamp;
begin
  v_end:=p_date+p_start+make_interval(mins=>p_duration);
  return not exists (
    select 1 from public.santomen_bookings b
    where b.barber_id=p_barber and b.booking_date=p_date
      and (b.status in ('confirmed','completed') or (b.status='pending' and b.expires_at>now()))
      and b.booking_date+b.starts_at<v_end
      and b.booking_date+b.ends_at>p_date+p_start
  ) and not exists(
    select 1 from public.santomen_blocks bl
    where bl.block_date=p_date and (bl.barber_id=p_barber or bl.barber_id is null)
      and p_date+bl.starts_at<v_end and p_date+bl.ends_at>p_date+p_start
  );
end $$;
revoke all on function santomen_private.is_slot_free(uuid,date,time,integer) from public;
-- Private helper is called by owner-controlled public RPCs only.

create or replace function public.santomen_public_catalog() returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object(
 'services',coalesce((select jsonb_agg(jsonb_build_object(
  'id',s.id,'name',s.name,'description',s.description,'category',s.category,
  'price_cents',s.price_cents,'duration_minutes',s.duration_minutes,'active',s.is_active
 ) order by s.sort_order,s.name) from public.santomen_services s where s.is_active), '[]'::jsonb),
 'barbers',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'bio',b.bio,'active',b.is_active) order by b.name)
  from public.santomen_barbers b where b.is_active),'[]'::jsonb),
 'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'category',m.category,'image_url',m.image_url) order by m.sort_order,m.created_at desc)
  from public.santomen_media m where m.published),'[]'::jsonb),
 'settings',(select jsonb_build_object('name',st.name,'address',st.address,'whatsapp',st.whatsapp,'opening',st.opening,'closing',st.closing)
  from public.santomen_settings st where st.id=1)
);
$$;
revoke all on function public.santomen_public_catalog() from public;
grant execute on function public.santomen_public_catalog() to anon,authenticated;

create or replace function public.santomen_available_slots(p_date date,p_service_id uuid,p_barber_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_settings public.santomen_settings%rowtype; v_barber public.santomen_barbers%rowtype;
v_duration integer;v_current timestamp;v_final timestamp;v_result jsonb:='[]'::jsonb;
begin
 if p_date<((now() at time zone 'America/Sao_Paulo')::date) or p_date>((now() at time zone 'America/Sao_Paulo')::date+60) then return v_result;end if;
 select * into v_settings from public.santomen_settings where id=1;
 select duration_minutes into v_duration from public.santomen_services where id=p_service_id and is_active;
 select * into v_barber from public.santomen_barbers where id=p_barber_id and is_active;
 if not found or v_duration is null or v_settings.id is null then return v_result;end if;
 if extract(isodow from p_date)::integer<>all(v_settings.working_days) or extract(isodow from p_date)::integer<>all(v_barber.working_days) then return v_result;end if;
 v_current:=p_date+greatest(v_settings.opening,v_barber.opening);
 v_final:=p_date+least(v_settings.closing,v_barber.closing);
 while v_current+make_interval(mins=>v_duration)<=v_final loop
  if v_current>(now() at time zone 'America/Sao_Paulo')
     and santomen_private.is_slot_free(p_barber_id,p_date,v_current::time,v_duration) then
       v_result:=v_result||to_jsonb(to_char(v_current,'HH24:MI'));
  end if;
  v_current:=v_current+make_interval(mins=>v_settings.step_minutes);
 end loop;
 return v_result;
end $$;
revoke all on function public.santomen_available_slots(date,uuid,uuid) from public;
grant execute on function public.santomen_available_slots(date,uuid,uuid) to anon,authenticated;

create or replace function public.santomen_request_booking(
 p_service_id uuid,p_barber_id uuid,p_date date,p_time text,
 p_customer_name text,p_phone text,p_privacy_accepted boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_service public.santomen_services%rowtype;v_barber public.santomen_barbers%rowtype;
v_settings public.santomen_settings%rowtype;v_start time;v_id uuid;v_phone text;
begin
 if p_privacy_accepted is distinct from true then raise exception 'Aceite de privacidade obrigatório';end if;
 if p_customer_name is null or char_length(btrim(p_customer_name)) not between 2 and 90 then raise exception 'Nome inválido';end if;
 v_phone:=regexp_replace(coalesce(p_phone,''),'\D','','g');
 if v_phone !~ '^([1-9][0-9]9[0-9]{8}|[1-9][0-9][2-8][0-9]{7})$' then raise exception 'Telefone inválido';end if;
 if p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Horário inválido';end if;
 v_start:=p_time::time;
 select * into v_service from public.santomen_services where id=p_service_id and is_active;
 if not found then raise exception 'Serviço indisponível';end if;
 select * into v_barber from public.santomen_barbers where id=p_barber_id and is_active;
 if not found then raise exception 'Profissional indisponível';end if;
 select * into v_settings from public.santomen_settings where id=1;
 if p_date<((now() at time zone 'America/Sao_Paulo')::date) or p_date>((now() at time zone 'America/Sao_Paulo')::date+60)
 or extract(isodow from p_date)::integer<>all(v_settings.working_days)
 or extract(isodow from p_date)::integer<>all(v_barber.working_days)
 or v_start<greatest(v_settings.opening,v_barber.opening)
 or v_start+make_interval(mins=>v_service.duration_minutes)>least(v_settings.closing,v_barber.closing)
 or p_date+v_start<=now() at time zone 'America/Sao_Paulo' then
  raise exception 'Data ou horário indisponível';
 end if;
 -- Lock all requests for a barber+day, including parallel guests, before overlap checks.
 perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text||p_date::text,13));
 if (select count(*) from public.santomen_bookings where phone=v_phone and source='online' and created_at>now()-interval '1 hour')>=3
 or (select count(*) from public.santomen_bookings where phone=v_phone and status='pending' and expires_at>now())>=2 then
  raise exception 'Limite temporário de solicitações atingido';
 end if;
 if not santomen_private.is_slot_free(p_barber_id,p_date,v_start,v_service.duration_minutes) then
  raise exception 'Horário reservado recentemente. Escolha outro';
 end if;
 insert into public.santomen_bookings(
   service_id,barber_id,booking_date,starts_at,ends_at,customer_name,phone,
   price_snapshot_cents,duration_snapshot_minutes,status,source,privacy_accepted,expires_at
 ) values(p_service_id,p_barber_id,p_date,v_start,(v_start+make_interval(mins=>v_service.duration_minutes))::time,
 btrim(p_customer_name),v_phone,v_service.price_cents,v_service.duration_minutes,'pending','online',true,now()+interval '12 hours')
 returning id into v_id;
 return jsonb_build_object('booking_id',v_id,'status','pending');
end $$;
revoke all on function public.santomen_request_booking(uuid,uuid,date,text,text,text,boolean) from public;
grant execute on function public.santomen_request_booking(uuid,uuid,date,text,text,text,boolean) to anon,authenticated;

create or replace function public.santomen_admin_manual_booking(
 p_service_id uuid,p_barber_id uuid,p_date date,p_time text,p_name text,p_phone text,p_source text default 'manual')
returns uuid language plpgsql security definer set search_path='' as $$
declare v_service public.santomen_services%rowtype;v_id uuid;v_time time;v_phone text;
begin
 if not santomen_private.is_admin() then raise exception 'Não autorizado';end if;
 if p_source not in ('manual','whatsapp','telephone','in_person') then raise exception 'Origem inválida';end if;
 if p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Hora inválida';end if;
 v_time:=p_time::time;v_phone:=regexp_replace(coalesce(p_phone,''),'\D','','g');
 if char_length(btrim(p_name))<2 or v_phone !~ '^([1-9][0-9]9[0-9]{8}|[1-9][0-9][2-8][0-9]{7})$' then raise exception 'Dados inválidos';end if;
 select * into v_service from public.santomen_services where id=p_service_id;
 if not found then raise exception 'Serviço inválido';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text||p_date::text,13));
 if not santomen_private.is_slot_free(p_barber_id,p_date,v_time,v_service.duration_minutes) then raise exception 'Horário ocupado';end if;
 insert into public.santomen_bookings(service_id,barber_id,booking_date,starts_at,ends_at,customer_name,phone,price_snapshot_cents,duration_snapshot_minutes,status,source,privacy_accepted)
 values(p_service_id,p_barber_id,p_date,v_time,(v_time+make_interval(mins=>v_service.duration_minutes))::time,
 btrim(p_name),v_phone,v_service.price_cents,v_service.duration_minutes,'confirmed',p_source,false) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.santomen_admin_manual_booking(uuid,uuid,date,text,text,text,text) from public;
grant execute on function public.santomen_admin_manual_booking(uuid,uuid,date,text,text,text,text) to authenticated;

create or replace function public.santomen_admin_open_cash(p_opening_cents integer default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not santomen_private.is_admin() then raise exception 'Não autorizado';end if;
 if p_opening_cents<0 then raise exception 'Saldo inválido';end if;
 insert into public.santomen_cash_sessions(opening_cents,opened_by)
 values(p_opening_cents,auth.uid()) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.santomen_admin_open_cash(integer) from public;
grant execute on function public.santomen_admin_open_cash(integer) to authenticated;

create or replace function public.santomen_admin_record_payment(
 p_booking_id uuid,p_cash integer default 0,p_pix integer default 0,p_debit integer default 0,p_credit integer default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_session uuid;v_booking public.santomen_bookings%rowtype;v_id uuid;v_count integer;
begin
 if not santomen_private.is_admin() then raise exception 'Não autorizado';end if;
 if p_cash<0 or p_pix<0 or p_debit<0 or p_credit<0 then raise exception 'Valores inválidos';end if;
 v_count:=(p_cash>0)::integer+(p_pix>0)::integer+(p_debit>0)::integer+(p_credit>0)::integer;
 if v_count<1 or v_count>2 then raise exception 'Utilize uma ou duas formas de pagamento';end if;
 select * into v_booking from public.santomen_bookings where id=p_booking_id for update;
 if not found then raise exception 'Agendamento não encontrado';end if;
 if v_booking.status in ('cancelled','rejected','expired') then raise exception 'Agendamento inválido';end if;
 if p_cash+p_pix+p_debit+p_credit<>v_booking.price_snapshot_cents then raise exception 'Soma diferente do valor do serviço';end if;
 select id into v_session from public.santomen_cash_sessions where closed_at is null for update;
 if v_session is null then raise exception 'Abra o caixa antes de registrar pagamentos';end if;
 insert into public.santomen_payments(booking_id,session_id,amount_cents,created_by)
 values(p_booking_id,v_session,v_booking.price_snapshot_cents,auth.uid()) returning id into v_id;
 if p_cash>0 then insert into public.santomen_payment_allocations(payment_id,method,amount_cents) values(v_id,'cash',p_cash);end if;
 if p_pix>0 then insert into public.santomen_payment_allocations(payment_id,method,amount_cents) values(v_id,'pix',p_pix);end if;
 if p_debit>0 then insert into public.santomen_payment_allocations(payment_id,method,amount_cents) values(v_id,'debit',p_debit);end if;
 if p_credit>0 then insert into public.santomen_payment_allocations(payment_id,method,amount_cents) values(v_id,'credit',p_credit);end if;
 update public.santomen_bookings set status='completed',updated_at=now() where id=p_booking_id;
 return v_id;
end $$;
revoke all on function public.santomen_admin_record_payment(uuid,integer,integer,integer,integer) from public;
grant execute on function public.santomen_admin_record_payment(uuid,integer,integer,integer,integer) to authenticated;

create or replace function public.santomen_admin_close_cash(p_counted_cents integer)
returns void language plpgsql security definer set search_path='' as $$
declare v_session uuid;
begin
 if not santomen_private.is_admin() then raise exception 'Não autorizado';end if;
 if p_counted_cents<0 then raise exception 'Valor inválido';end if;
 select id into v_session from public.santomen_cash_sessions where closed_at is null for update;
 if v_session is null then raise exception 'Nenhum caixa aberto';end if;
 update public.santomen_cash_sessions
 set closed_at=now(),closed_by=auth.uid(),closing_counted_cents=p_counted_cents
 where id=v_session;
end $$;
revoke all on function public.santomen_admin_close_cash(integer) from public;
grant execute on function public.santomen_admin_close_cash(integer) to authenticated;

create or replace function public.santomen_admin_refund(p_payment_id uuid,p_amount_cents integer,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_paid public.santomen_payments%rowtype;v_refunded integer;v_id uuid;
begin
 if not santomen_private.is_admin() then raise exception 'Não autorizado';end if;
 if p_amount_cents<=0 or length(btrim(coalesce(p_reason,'')))<3 then raise exception 'Dados de estorno inválidos';end if;
 select * into v_paid from public.santomen_payments where id=p_payment_id for update;
 if not found then raise exception 'Pagamento não encontrado';end if;
 select coalesce(sum(amount_cents),0) into v_refunded from public.santomen_refunds where payment_id=p_payment_id;
 if v_refunded+p_amount_cents>v_paid.amount_cents then raise exception 'Estorno excede o pagamento';end if;
 insert into public.santomen_refunds(payment_id,amount_cents,reason,created_by)
 values(p_payment_id,p_amount_cents,btrim(p_reason),auth.uid()) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.santomen_admin_refund(uuid,integer,text) from public;
grant execute on function public.santomen_admin_refund(uuid,integer,text) to authenticated;

-- IMPORTANT:
-- 1. No admin user, services, barber or customer records are created by this migration.
-- 2. Service prices/durations must be entered by the owner before online bookings are enabled.
-- 3. Review phone abuse controls, expiry housekeeping, WhatsApp and financial reporting in staging.
-- 4. Do not mark this migration applied until SQL execution and RLS/atomicity tests pass.
