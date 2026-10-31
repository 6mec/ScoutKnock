-- Sites demo. Só dados públicos e comerciais da empresa; apagados ao fim de 30 dias.
create table public.demo_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]{12}$'),
  company_id text not null check (char_length(company_id) <= 200),
  company_name text not null check (char_length(company_name) between 1 and 120),
  niche text not null check (char_length(niche) <= 80),
  locality text not null check (char_length(locality) <= 80),
  address text not null check (char_length(address) <= 200),
  phone text check (char_length(phone) <= 40),
  template text not null default 'classic' check (template in ('classic', 'bold', 'soft')),
  accent_color text not null check (accent_color ~ '^#[0-9A-F]{6}$'),
  headline text not null check (char_length(headline) between 1 and 120),
  intro text not null check (char_length(intro) between 1 and 400),
  author_name text not null check (char_length(author_name) between 1 and 80),
  status text not null default 'draft' check (status in ('draft', 'sent')),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create index demo_sites_user_created_idx on public.demo_sites (user_id, created_at desc);
create index demo_sites_expires_at_idx on public.demo_sites (expires_at);

-- RLS ativo. Anónimos não leem a tabela: a página pública usa get_public_demo.
alter table public.demo_sites enable row level security;

-- Sem delete: apagar não pode devolver quota. A data de validade não é alterável.
revoke all on table public.demo_sites from anon, authenticated;
grant select on table public.demo_sites to authenticated;
grant insert (
  user_id, slug, company_id, company_name, niche, locality, address, phone,
  accent_color, headline, intro, author_name
) on table public.demo_sites to authenticated;
grant update (
  company_name, template, accent_color, headline, intro, status
) on table public.demo_sites to authenticated;

create policy "demo_sites_select_own"
  on public.demo_sites
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "demo_sites_insert_own"
  on public.demo_sites
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "demo_sites_update_own"
  on public.demo_sites
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger demo_sites_set_updated_at
  before update on public.demo_sites
  for each row execute function public.set_updated_at();

-- Limite provisório: 2 demos por mês, o do pack de teste, até os packs estarem ligados.
create function public.enforce_demo_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- O bloqueio impede que dois pedidos simultâneos passem o limite.
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  if (
    select count(*)
    from public.demo_sites
    where user_id = new.user_id
      and created_at >= date_trunc('month', now())
  ) >= 2 then
    raise exception 'demo_limit';
  end if;

  return new;
end;
$$;

create trigger demo_sites_enforce_limit
  before insert on public.demo_sites
  for each row execute function public.enforce_demo_limit();

-- Só devolve uma demo ativa pelo código, com as colunas públicas. Não permite listar.
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
  author_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select company_name, niche, locality, address, phone, template,
         accent_color, headline, intro, author_name
  from public.demo_sites
  where slug = demo_slug and expires_at > now();
$$;

revoke execute on function public.get_public_demo(text) from public;
grant execute on function public.get_public_demo(text) to anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'demo-sites-purge',
  '30 3 * * *',
  $$delete from public.demo_sites where expires_at < now()$$
);
