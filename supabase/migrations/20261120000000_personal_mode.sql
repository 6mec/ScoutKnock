-- Modo pessoal: o admin publica os sites dos seus clientes sem o Stripe (cobra por
-- fora), e os sites ganham uma secção de marcações.

-- 1. Publicação direta, só para o admin.
alter table public.official_sites
  add column published_directly boolean not null default false;

grant select (published_directly) on table public.official_sites to authenticated;

-- Usa as mesmas regras do nome, da confirmação e do dono que a reserva antes do Checkout.
create function public.publish_official_site_directly(
  target_demo uuid,
  wanted_name text,
  confirmed boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  result text;
begin
  if me is null or not public.is_admin(me) then
    return 'forbidden';
  end if;

  result := public.reserve_official_site(target_demo, wanted_name, confirmed);
  if result <> 'ok' then
    return result;
  end if;

  update public.official_sites set
    status = 'active',
    published_directly = true,
    name_reserved_until = null,
    ended_at = null,
    updated_at = now()
  where demo_id = target_demo and user_id = me;

  update public.demo_sites set expires_at = null where id = target_demo and user_id = me;

  return 'ok';
end;
$$;

revoke execute on function public.publish_official_site_directly(uuid, text, boolean) from public, anon;
grant execute on function public.publish_official_site_directly(uuid, text, boolean) to authenticated;

-- Tira do ar um site publicado diretamente: volta a demo, com o aviso, e o nome fica
-- guardado 30 dias, como quando uma subscrição acaba.
create function public.unpublish_official_site_directly(target_demo uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null or not public.is_admin(me) then
    return false;
  end if;

  update public.official_sites set
    status = 'ended',
    cancel_at_period_end = false,
    name_reserved_until = now() + interval '30 days',
    ended_at = now(),
    updated_at = now()
  where demo_id = target_demo
    and user_id = me
    and published_directly
    and status in ('active', 'past_due');

  if not found then
    return false;
  end if;

  update public.demo_sites
  set expires_at = now() + interval '30 days'
  where id = target_demo and user_id = me;

  return true;
end;
$$;

revoke execute on function public.unpublish_official_site_directly(uuid) from public, anon;
grant execute on function public.unpublish_official_site_directly(uuid) to authenticated;

-- 2. Marcações: a secção liga-se por site, com o horário escrito pelo freelancer.
alter table public.demo_sites
  add column booking_enabled boolean not null default false,
  add column booking_hours text check (char_length(booking_hours) <= 120);

grant insert (booking_enabled, booking_hours) on table public.demo_sites to authenticated;
grant update (booking_enabled, booking_hours) on table public.demo_sites to authenticated;

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
  highlights jsonb,
  booking_enabled boolean,
  booking_hours text
)
language sql
stable
security definer
set search_path = ''
as $$
  select company_name, niche, locality, address, phone, template,
         accent_color, headline, intro, author_name,
         niche_style, subheadline, cta_label, about, services, highlights,
         booking_enabled, booking_hours
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
  highlights jsonb,
  booking_enabled boolean,
  booking_hours text
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.company_name, d.niche, d.locality, d.address, d.phone, d.template,
         d.accent_color, d.headline, d.intro, d.author_name,
         d.niche_style, d.subheadline, d.cta_label, d.about, d.services, d.highlights,
         d.booking_enabled, d.booking_hours
  from public.official_sites as s
  join public.demo_sites as d on d.id = s.demo_id
  where s.name = site_name and s.status in ('active', 'past_due');
$$;

revoke execute on function public.get_official_site(text) from public;
grant execute on function public.get_official_site(text) to anon, authenticated;
