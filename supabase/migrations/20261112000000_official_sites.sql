-- Sites oficiais: uma demo publicada, com subscrição própria de 5 €/mês.
-- Sem data de validade, a limpeza diária nunca apaga um site oficial.
alter table public.demo_sites alter column expires_at drop not null;

create table public.official_sites (
  demo_id uuid primary key references public.demo_sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null unique check (name ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  status text not null check (status in ('pending', 'active', 'past_due', 'ended')),
  stripe_subscription_id text unique,
  cancel_at_period_end boolean not null default false,
  period_end timestamptz,
  -- A confirmação de que a empresa aceitou, com quem e quando.
  confirmed_at timestamptz not null,
  confirmed_by uuid not null,
  -- Até quando o nome fica guardado: Checkout em curso ou site que saiu do ar.
  name_reserved_until timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index official_sites_user_idx on public.official_sites (user_id);

-- O dono lê o estado, sem o identificador do Stripe. Só o servidor escreve.
alter table public.official_sites enable row level security;
revoke all on table public.official_sites from anon, authenticated;
grant select (
  demo_id, user_id, name, status, cancel_at_period_end, period_end,
  confirmed_at, confirmed_by, name_reserved_until, ended_at
) on table public.official_sites to authenticated;
grant select on table public.official_sites to service_role;

create policy "official_sites_select_own"
  on public.official_sites
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Guarda o nome e a confirmação antes do Checkout. O utilizador vem sempre da sessão.
create function public.reserve_official_site(
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
  holder public.official_sites;
begin
  if me is null or confirmed is not true then
    return 'invalid';
  end if;

  if wanted_name !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
    or wanted_name = any (array[
      'www', 'api', 'app', 'admin', 'mail', 'email', 'painel', 'suporte', 'support',
      'scoutknock', 'status', 'blog', 'ajuda', 'help', 'static', 'assets', 'bot'
    ])
  then
    return 'invalid';
  end if;

  perform pg_advisory_xact_lock(hashtext('official:' || wanted_name));

  if exists (
    select 1 from public.official_sites
    where demo_id = target_demo and status in ('active', 'past_due')
  ) then
    return 'already';
  end if;

  if not exists (
    select 1 from public.demo_sites
    where id = target_demo and user_id = me and expires_at > now()
  ) then
    return 'forbidden';
  end if;

  select * into holder
  from public.official_sites
  where name = wanted_name and demo_id <> target_demo;

  if found then
    -- O nome de um site que saiu do ar fica para o antigo dono durante o prazo.
    if holder.status in ('active', 'past_due')
      or (
        holder.name_reserved_until > now()
        and not (holder.user_id = me and holder.status = 'ended')
      )
    then
      return 'taken';
    end if;

    delete from public.official_sites where demo_id = holder.demo_id;
  end if;

  insert into public.official_sites (
    demo_id, user_id, name, status, confirmed_at, confirmed_by, name_reserved_until
  )
  values (
    target_demo, me, wanted_name, 'pending', now(), me, now() + interval '24 hours'
  )
  on conflict (demo_id) do update set
    name = excluded.name,
    status = 'pending',
    stripe_subscription_id = null,
    cancel_at_period_end = false,
    period_end = null,
    confirmed_at = excluded.confirmed_at,
    confirmed_by = excluded.confirmed_by,
    name_reserved_until = excluded.name_reserved_until,
    ended_at = null,
    updated_at = now();

  return 'ok';
end;
$$;

revoke execute on function public.reserve_official_site(uuid, text, boolean) from public, anon;
grant execute on function public.reserve_official_site(uuid, text, boolean) to authenticated;

-- Marca o evento e muda o estado na mesma transação, como nos packs.
-- Devolve applied, duplicate ou missing.
create function public.apply_official_site_event(
  event_id text,
  event_type text,
  target_demo uuid,
  target_user uuid,
  subscription_id text,
  new_status text,
  new_cancel_at_period_end boolean,
  new_period_end timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  site public.official_sites;
  now_live boolean := new_status in ('active', 'past_due');
  was_live boolean;
begin
  insert into public.stripe_events (id, type)
  values (event_id, event_type)
  on conflict (id) do nothing;

  if not found then
    return 'duplicate';
  end if;

  select * into site
  from public.official_sites
  where demo_id = target_demo and user_id = target_user
  for update;

  if not found then
    return 'missing';
  end if;

  was_live := site.status in ('active', 'past_due');

  -- Um evento de uma subscrição antiga não pode tirar do ar a que está em vigor.
  if site.stripe_subscription_id is not null
    and site.stripe_subscription_id <> subscription_id
    and was_live
    and not now_live
  then
    return 'applied';
  end if;

  if now_live then
    update public.official_sites set
      status = new_status,
      stripe_subscription_id = subscription_id,
      cancel_at_period_end = new_cancel_at_period_end,
      period_end = new_period_end,
      name_reserved_until = null,
      ended_at = null,
      updated_at = now()
    where demo_id = target_demo;

    update public.demo_sites set expires_at = null where id = target_demo;
  elsif new_status in ('canceled', 'unpaid', 'incomplete_expired') and was_live then
    -- Volta a demo, com o aviso, e o nome fica guardado para o dono.
    update public.official_sites set
      status = 'ended',
      cancel_at_period_end = false,
      name_reserved_until = now() + interval '30 days',
      ended_at = now(),
      updated_at = now()
    where demo_id = target_demo;

    update public.demo_sites
    set expires_at = now() + interval '30 days'
    where id = target_demo;
  end if;

  return 'applied';
end;
$$;

revoke execute on function public.apply_official_site_event(
  text, text, uuid, uuid, text, text, boolean, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_official_site_event(
  text, text, uuid, uuid, text, text, boolean, timestamptz
) to service_role;

-- Só devolve um site no ar, pelo nome, com as colunas públicas. Não permite listar.
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
  author_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.company_name, d.niche, d.locality, d.address, d.phone, d.template,
         d.accent_color, d.headline, d.intro, d.author_name
  from public.official_sites as s
  join public.demo_sites as d on d.id = s.demo_id
  where s.name = site_name and s.status in ('active', 'past_due');
$$;

revoke execute on function public.get_official_site(text) from public;
grant execute on function public.get_official_site(text) to anon, authenticated;

-- Para o endereço antigo da demo levar ao site oficial.
create function public.official_name_for_demo(demo_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.name
  from public.official_sites as s
  join public.demo_sites as d on d.id = s.demo_id
  where d.slug = demo_slug and s.status in ('active', 'past_due');
$$;

revoke execute on function public.official_name_for_demo(text) from public;
grant execute on function public.official_name_for_demo(text) to anon, authenticated;
