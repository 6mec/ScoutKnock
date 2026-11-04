-- Empresas do OpenStreetMap: a ficha guarda também a morada e o telefone (dados abertos,
-- licença ODbL, com atribuição), editáveis, e a data em que vieram do OpenStreetMap.
-- Do Google continua a guardar-se só o place_id e o que o freelancer escreve.

alter table public.contacts
  add column osm_data_on date;

comment on column public.contacts.osm_data_on is
  'Só em empresas do OpenStreetMap: dia em que a morada e o telefone vieram de lá.';

-- Nas empresas do OpenStreetMap só se guardam a morada e o telefone; o resto continua
-- a ser só das empresas manuais. Nas do Google, nenhum destes campos.
alter table public.contacts
  drop constraint contacts_manual_fields_only_manual;

alter table public.contacts
  add constraint contacts_manual_fields_only_manual check (
    company_id like 'manual-%'
    or (
      company_id like 'osm-%'
      and manual_niche is null and manual_locality is null and manual_website is null
      and manual_reviews is null and manual_hours is null
    )
    or (
      manual_niche is null and manual_locality is null and manual_address is null
      and manual_phone is null and manual_website is null
      and manual_reviews is null and manual_hours is null
    )
  );

alter table public.contacts
  add constraint contacts_osm_data_only_osm check (
    osm_data_on is null or company_id like 'osm-%'
  );

grant insert (osm_data_on) on table public.contacts to authenticated;
grant update (osm_data_on) on table public.contacts to authenticated;
