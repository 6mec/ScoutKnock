-- Empresas adicionadas à mão, sem o Google: o freelancer escreve os dados que viu
-- (por exemplo no Google Maps) e a nota, a mensagem e o site demo usam-nos.
-- O company_id destas empresas começa por "manual-" e nunca é um place_id.
alter table public.contacts
  add column manual_niche text check (char_length(manual_niche) <= 80),
  add column manual_locality text check (char_length(manual_locality) <= 80),
  add column manual_address text check (char_length(manual_address) <= 200),
  add column manual_phone text check (char_length(manual_phone) <= 40),
  add column manual_website text check (char_length(manual_website) <= 300),
  add column manual_reviews integer check (manual_reviews between 0 and 1000000),
  add column manual_hours boolean;

comment on column public.contacts.manual_niche is 'Só em empresas manuais: escrito pelo freelancer.';

grant insert (
  manual_niche, manual_locality, manual_address, manual_phone, manual_website,
  manual_reviews, manual_hours
) on table public.contacts to authenticated;
grant update (
  manual_niche, manual_locality, manual_address, manual_phone, manual_website,
  manual_reviews, manual_hours
) on table public.contacts to authenticated;

-- Os campos manuais só valem para empresas manuais.
alter table public.contacts
  add constraint contacts_manual_fields_only_manual check (
    company_id like 'manual-%'
    or (
      manual_niche is null and manual_locality is null and manual_address is null
      and manual_phone is null and manual_website is null
      and manual_reviews is null and manual_hours is null
    )
  );
