-- Portfólio do freelancer: uma página pública em /p/nome, escrita por ele.
-- Só aparece com published = true. Os sites oficiais dele entram sozinhos.
create table public.portfolios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  published boolean not null default false,
  display_name text not null check (char_length(display_name) between 1 and 80),
  headline text check (char_length(headline) <= 120),
  about text check (char_length(about) <= 1200),
  city text check (char_length(city) <= 80),
  whatsapp text check (char_length(whatsapp) <= 40),
  email text check (char_length(email) <= 200),
  services jsonb not null default '[]'::jsonb
    check (jsonb_typeof(services) = 'array' and jsonb_array_length(services) <= 6),
  projects jsonb not null default '[]'::jsonb
    check (jsonb_typeof(projects) = 'array' and jsonb_array_length(projects) <= 8),
  show_sites boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolios enable row level security;
revoke all on table public.portfolios from anon, authenticated;
grant select, insert, update, delete on table public.portfolios to authenticated;

create policy "portfolios_select_own"
  on public.portfolios for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "portfolios_insert_own"
  on public.portfolios for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "portfolios_update_own"
  on public.portfolios for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "portfolios_delete_own"
  on public.portfolios for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Os nomes reservados batem certo com os dos sites oficiais.
alter table public.portfolios add constraint portfolios_slug_not_reserved check (
  slug not in (
    'www', 'api', 'app', 'admin', 'mail', 'email', 'painel', 'suporte', 'support',
    'scoutknock', 'status', 'blog', 'ajuda', 'help', 'static', 'assets', 'bot'
  )
);

-- Página pública: só os campos públicos, sem o user_id, e só se estiver publicado.
create function public.get_portfolio(portfolio_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', p.slug,
    'display_name', p.display_name,
    'headline', p.headline,
    'about', p.about,
    'city', p.city,
    'whatsapp', p.whatsapp,
    'email', p.email,
    'services', p.services,
    'projects', p.projects,
    'sites', case when p.show_sites then coalesce((
      select jsonb_agg(jsonb_build_object('name', s.name, 'company_name', d.company_name)
                       order by s.created_at desc)
      from public.official_sites as s
      join public.demo_sites as d on d.id = s.demo_id
      where s.user_id = p.user_id and s.status in ('active', 'past_due')
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from public.portfolios as p
  where p.slug = portfolio_slug and p.published;
$$;

revoke execute on function public.get_portfolio(text) from public;
grant execute on function public.get_portfolio(text) to anon, authenticated;
