-- Portfólio com trabalho real (T12). Os trabalhos vêm dos projetos entregues que o Daniel
-- marca como "pode mostrar"; as opiniões são só as que ele escreve e marca como autorizadas.
-- A lista antiga escrita à mão (portfolios.projects) e os sites das demos ficam guardados,
-- mas deixam de sair na página pública.

-- 1. Projetos: o que aparece no portfólio.
alter table public.client_projects
  add column portfolio_show boolean not null default false,
  add column portfolio_summary text check (char_length(portfolio_summary) <= 160),
  add column portfolio_url text check (char_length(portfolio_url) <= 300 and portfolio_url ~ '^https?://'),
  add column portfolio_image text check (char_length(portfolio_image) <= 200);

-- A imagem só pode estar na pasta de quem é dono do projeto.
alter table public.client_projects add constraint client_projects_portfolio_image_own
  check (portfolio_image is null or portfolio_image like (user_id::text || '/%'));

grant insert (portfolio_show, portfolio_summary, portfolio_url, portfolio_image) on table public.client_projects to authenticated;
grant update (portfolio_show, portfolio_summary, portfolio_url, portfolio_image) on table public.client_projects to authenticated;

-- 2. Portfólio: os 4 passos, o "a partir de" opcional e o interruptor do Google.
alter table public.portfolios
  add column process_steps jsonb not null default '[]'::jsonb
    check (jsonb_typeof(process_steps) = 'array' and jsonb_array_length(process_steps) <= 4),
  add column price_from text check (char_length(price_from) <= 60),
  add column indexable boolean not null default false;

-- 3. Opiniões de clientes: escritas pelo Daniel, só públicas com "autorizado".
create table public.portfolio_testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.client_projects (id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 40),
  company text not null check (char_length(company) between 1 and 80),
  quote text not null check (char_length(quote) between 1 and 400),
  authorized boolean not null default false,
  created_at timestamptz not null default now()
);

create index portfolio_testimonials_user_idx on public.portfolio_testimonials (user_id, created_at);

alter table public.portfolio_testimonials enable row level security;
revoke all on table public.portfolio_testimonials from anon, authenticated;
grant select, delete on table public.portfolio_testimonials to authenticated;
grant insert (project_id, first_name, company, quote, authorized) on table public.portfolio_testimonials to authenticated;
grant update (project_id, first_name, company, quote, authorized) on table public.portfolio_testimonials to authenticated;

create policy "portfolio_testimonials_select_own" on public.portfolio_testimonials
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "portfolio_testimonials_insert_own" on public.portfolio_testimonials
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (project_id is null or exists (
      select 1 from public.client_projects p where p.id = project_id and p.user_id = (select auth.uid())
    ))
  );

create policy "portfolio_testimonials_update_own" on public.portfolio_testimonials
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (project_id is null or exists (
      select 1 from public.client_projects p where p.id = project_id and p.user_id = (select auth.uid())
    ))
  );

create policy "portfolio_testimonials_delete_own" on public.portfolio_testimonials
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 4. Capturas dos trabalhos: espaço público para ler, 1 MB por ficheiro, só imagens.
-- Cada pessoa só escreve na sua pasta (o primeiro nível do caminho é o id dela).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "portfolio_images_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "portfolio_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "portfolio_images_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "portfolio_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 5. Endereço livre? Diz só sim ou não, sem mostrar de quem é.
create function public.portfolio_slug_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.portfolios p
    where p.slug = candidate and p.user_id <> (select auth.uid())
  );
$$;

revoke execute on function public.portfolio_slug_available(text) from public, anon;
grant execute on function public.portfolio_slug_available(text) to authenticated;

-- 6. Página pública: só campos públicos. Trabalhos só dos projetos entregues, em
-- manutenção ou terminados marcados para mostrar; opiniões só autorizadas. A lista antiga
-- e os sites das demos saem (vazios), para a página não os mostrar.
create or replace function public.get_portfolio(portfolio_slug text)
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
    'process_steps', p.process_steps,
    'price_from', p.price_from,
    'indexable', p.indexable,
    'works', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'company_name', c.company_name,
        'kind', c.kind,
        'summary', c.portfolio_summary,
        'url', c.portfolio_url,
        'image', c.portfolio_image
      ) order by coalesce(c.delivered_on, c.created_at::date) desc)
      from public.client_projects as c
      where c.user_id = p.user_id
        and c.portfolio_show
        and c.status in ('delivered', 'maintenance', 'finished')
    ), '[]'::jsonb),
    'testimonials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'first_name', t.first_name,
        'company', t.company,
        'quote', t.quote
      ) order by t.created_at)
      from public.portfolio_testimonials as t
      where t.user_id = p.user_id and t.authorized
    ), '[]'::jsonb),
    'projects', '[]'::jsonb,
    'sites', '[]'::jsonb
  )
  from public.portfolios as p
  where p.slug = portfolio_slug and p.published;
$$;
