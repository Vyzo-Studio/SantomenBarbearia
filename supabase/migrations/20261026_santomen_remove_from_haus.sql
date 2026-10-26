-- Santomen Barbearia: detach from shared HAUS project on 2026-10-26.
-- NO CASCADE and NO changes to Haus, Luence, auth.users or other tenants.
-- Refuse destructive changes if operational data was added since inventory.
do $santomen_teardown_guard$
begin
 if exists(select 1 from public.santomen_admins)
    or exists(select 1 from public.santomen_services)
    or exists(select 1 from public.santomen_barbers)
    or exists(select 1 from public.santomen_blocks)
    or exists(select 1 from public.santomen_bookings)
    or exists(select 1 from public.santomen_cash_sessions)
    or exists(select 1 from public.santomen_payments)
    or exists(select 1 from public.santomen_payment_allocations)
    or exists(select 1 from public.santomen_refunds)
    or exists(select 1 from public.santomen_media)
 then raise exception 'Santomen operational records now exist — cancel deletion';
 end if;
end $santomen_teardown_guard$;

drop function if exists public.santomen_admin_close_cash(integer);
drop function if exists public.santomen_admin_manual_booking(uuid,uuid,date,text,text,text,text);
drop function if exists public.santomen_admin_open_cash(integer);
drop function if exists public.santomen_admin_record_payment(uuid,integer,integer,integer,integer);
drop function if exists public.santomen_admin_refund(uuid,integer,text);
drop function if exists public.santomen_admin_set_booking_status(uuid,text);
drop function if exists public.santomen_available_slots(date,uuid,uuid);
drop function if exists public.santomen_public_catalog();
drop function if exists public.santomen_request_booking(uuid,uuid,date,text,text,text,boolean);

drop table if exists public.santomen_refunds;
drop table if exists public.santomen_payment_allocations;
drop table if exists public.santomen_payments;
drop table if exists public.santomen_cash_sessions;
drop table if exists public.santomen_bookings;
drop table if exists public.santomen_blocks;
drop table if exists public.santomen_services;
drop table if exists public.santomen_barbers;
drop table if exists public.santomen_media;
drop table if exists public.santomen_settings;
drop table if exists public.santomen_admins;
drop schema if exists santomen_private restrict;
