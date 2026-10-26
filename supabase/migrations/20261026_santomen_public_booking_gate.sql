-- Santomen staged activation inside the existing Haus Supabase project.
-- Online public booking remains disabled until real services, durations, prices,
-- barbers, risk controls, and an authorized Santomen administrator are verified.
-- Do not modify or revoke ANY Haus or Luence role, table, policy or function.
revoke execute on function public.santomen_public_catalog() from PUBLIC, anon, authenticated;
revoke execute on function public.santomen_available_slots(date,uuid,uuid) from PUBLIC, anon, authenticated;
revoke execute on function public.santomen_request_booking(uuid,uuid,date,text,text,text,boolean) from PUBLIC, anon, authenticated;
