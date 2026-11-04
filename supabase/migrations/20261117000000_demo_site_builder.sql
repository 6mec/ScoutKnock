-- Sites demo completos: identidade do nicho, subtítulo, botão, serviços, destaques e
-- "sobre". Tudo escrito pelo freelancer ou sugerido pela app (modelo do nicho ou Claude).
alter table public.demo_sites
  add column niche_style text check (niche_style in (
    'barbearia', 'cabeleireiro', 'restaurante', 'cafe', 'clinica', 'dentista', 'ginasio',
    'animais', 'oficina', 'imobiliaria', 'escritorio', 'loja', 'generico'
  )),
  add column subheadline text check (char_length(subheadline) <= 200),
  add column cta_label text check (char_length(cta_label) <= 40),
  add column about text check (char_length(about) <= 800),
  add column services jsonb not null default '[]'::jsonb
    check (jsonb_typeof(services) = 'array' and jsonb_array_length(services) <= 6),
  add column highlights jsonb not null default '[]'::jsonb
    check (jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) <= 3),
  -- Textos escritos pelo Claude para esta demo: no máximo 3, para o custo ter teto.
  add column ai_generations smallint not null default 0 check (ai_generations between 0 and 3);

-- A disposição também se escolhe ao criar (antes só se mudava depois).
grant insert (template, niche_style, subheadline, cta_label, about, services, highlights)
  on table public.demo_sites to authenticated;
grant update (niche_style, subheadline, cta_label, about, services, highlights)
  on table public.demo_sites to authenticated;

-- Gasta uma das 3 escritas com o Claude antes de o chamar. Devolve as que restam,
-- ou -1 se a demo não é da pessoa ou já não há escritas.
create function public.use_demo_ai_generation(target_demo uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  used smallint;
begin
  update public.demo_sites
  set ai_generations = ai_generations + 1
  where id = target_demo and user_id = (select auth.uid()) and ai_generations < 3
  returning ai_generations into used;

  return coalesce(3 - used, -1);
end;
$$;

revoke execute on function public.use_demo_ai_generation(uuid) from public, anon;
grant execute on function public.use_demo_ai_generation(uuid) to authenticated;

-- As páginas públicas passam a devolver também os campos novos.
drop function public.get_public_demo(text);
create function public.get_public_demo(demo_slug text)
returns table (
  company_name text,
  niche text,
  locality text,
  address text,
  phone text,
  template text,
  accent_color text,
  headline text,
  intro text,
  author_name text,
  niche_style text,
  subheadline text,
  cta_label text,
  about text,
  services jsonb,
  highlights jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select company_name, niche, locality, address, phone, template,
         accent_color, headline, intro, author_name,
         niche_style, subheadline, cta_label, about, services, highlights
  from public.demo_sites
  where slug = demo_slug and expires_at > now();
$$;

revoke execute on function public.get_public_demo(text) from public;
grant execute on function public.get_public_demo(text) to anon, authenticated;

drop function public.get_official_site(text);
create function public.get_official_site(site_name text)
returns table (
  company_name text,
  niche text,
  locality text,
  address text,
  phone text,
  template text,
  accent_color text,
  headline text,
  intro text,
  author_name text,
  niche_style text,
  subheadline text,
  cta_label text,
  about text,
  services jsonb,
  highlights jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.company_name, d.niche, d.locality, d.address, d.phone, d.template,
         d.accent_color, d.headline, d.intro, d.author_name,
         d.niche_style, d.subheadline, d.cta_label, d.about, d.services, d.highlights
  from public.official_sites as s
  join public.demo_sites as d on d.id = s.demo_id
  where s.name = site_name and s.status in ('active', 'past_due');
$$;

revoke execute on function public.get_official_site(text) from public;
grant execute on function public.get_official_site(text) to anon, authenticated;
