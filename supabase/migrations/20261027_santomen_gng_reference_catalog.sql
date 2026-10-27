-- 2026-10-27: price and duration references from GNG, per owner request.
-- This data was entered in the exclusive Santomen project (not GNG); it must be reviewed.
-- All copies start INACTIVE and are not displayed publicly until owner approval.
-- Safe to rerun; existing renamed/edited items are not overwritten.
with seed(name,description,price_cents,duration_minutes,sort_order) as (
 values
  ('Barba','Barba alinhada e acabamento.',2500,20,1),
  ('Corte','Corte masculino com acabamento.',3000,20,2),
  ('Corte + Barba','Corte completo com barba.',5500,40,3),
  ('Corte + Graxa','Corte com finalização em graxa.',5000,40,4),
  ('Corte + Hidratação','Corte com hidratação.',4500,20,5),
  ('Corte + Sobrancelha','Corte com design de sobrancelha.',4000,20,6),
  ('Corte + Barba + Sobrancelha','Combo completo de corte, barba e sobrancelha.',6500,40,7),
  ('Corte + Barba + Sobrancelha + Limpeza de Pele','Experiência completa com limpeza de pele.',11000,80,8),
  ('Corte + Bigode','Corte com acabamento de bigode.',4000,20,9),
  ('Corte + Bigode + Sobrancelha','Corte, bigode e sobrancelha.',4500,20,10),
  ('Corte + Sobrancelha + Limpeza de Pele','Corte com sobrancelha e limpeza de pele.',8500,40,11),
  ('Graxa','Aplicação e finalização em graxa.',2000,20,12),
  ('Limpeza de Pele','Limpeza de pele masculina.',5000,20,13)
)
insert into public.santomen_services(name,description,category,price_cents,duration_minutes,sort_order,is_active)
select s.name,s.description,'Referência GNG',s.price_cents,s.duration_minutes,s.sort_order,false
from seed s where not exists(select 1 from public.santomen_services existing where lower(existing.name)=lower(s.name));
