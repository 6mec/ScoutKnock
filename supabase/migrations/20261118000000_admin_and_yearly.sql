-- Papel de administrador e packs anuais.
--
-- 1. Quem está em user_roles com o papel 'admin' deixa de ter os limites do pack.
--    Os tetos de custo do projeto inteiro (Google e Anthropic) continuam a valer.
--    Ninguém se torna admin pela app: só por SQL, no SQL Editor.
-- 2. Num pack anual, o consumo renova todos os meses, a contar do início do período
--    do Stripe. Num pack mensal, nada muda.

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Sem políticas: os browsers não leem nem escrevem nesta tabela.
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

create function public.is_admin(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = target_user and role = 'admin'
  );
$$;

revoke execute on function public.is_admin(uuid) from public, anon, authenticated;

-- Só responde pela própria pessoa: não dá para perguntar por outra conta.
create function public.am_i_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin((select auth.uid()));
$$;

revoke execute on function public.am_i_admin() from public, anon;
grant execute on function public.am_i_admin() to authenticated;

-- Têm de bater certo com PLANS e ADMIN_LIMITS em src/lib/account/rules.ts.
create or replace function public.plan_limits(target_user uuid)
returns table (searches integer, demos integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when public.is_admin(target_user) then 10000
      when s.status = 'active' then
        case s.plan when 'starter' then 100 when 'pro' then 150 when 'agency' then 245 else 10 end
      else 10
    end,
    case
      when public.is_admin(target_user) then 10000
      when s.status = 'active' then
        case s.plan when 'starter' then 10 when 'pro' then 50 when 'agency' then 200 else 2 end
      else 2
    end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user;
$$;

create or replace function public.plan_lookup_limits(target_user uuid)
returns table (daily integer, monthly integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when public.is_admin(target_user) then 1000
      when s.status = 'active' then
        case s.plan when 'starter' then 3 when 'pro' then 10 when 'agency' then 25 else 3 end
      else 3
    end,
    case
      when public.is_admin(target_user) then 10000
      when s.status = 'active' then
        case s.plan when 'starter' then 90 when 'pro' then 300 when 'agency' then 750 else 90 end
      else 90
    end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user;
$$;

-- O período em que o consumo conta. Com subscrição, é o do Stripe, cortado em fatias
-- de um mês a contar do início: num pack mensal há uma só fatia, num anual há doze.
-- No teste é o próprio teste. Sem subscrição ou com o período já passado, é o mês de
-- calendário.
create or replace function public.usage_period(target_user uuid)
returns table (period_start timestamptz, period_end timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when live.ok then slice.start_at else public.lisbon_month_start() end,
    case when live.ok then least(slice.start_at + interval '1 month', s.current_period_end)
      else (date_trunc('month', now() at time zone 'Europe/Lisbon') + interval '1 month')
        at time zone 'Europe/Lisbon'
    end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user
  cross join lateral (
    select coalesce(
      s.status in ('active', 'trialing', 'past_due', 'unpaid')
        and s.current_period_start is not null
        and s.current_period_end > now(),
      false
    ) as ok
  ) as live
  cross join lateral (
    select s.current_period_start + make_interval(months => greatest(0, (
      extract(year from age(now(), s.current_period_start)) * 12
      + extract(month from age(now(), s.current_period_start))
    )::integer)) as start_at
  ) as slice;
$$;

revoke execute on function public.usage_period(uuid) from public, anon, authenticated;

-- Para te tornares admin, corre no SQL Editor, com o email da tua conta:
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'o-teu-email@exemplo.pt';
