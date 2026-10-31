-- Subscrições Stripe e limites dos packs. Nunca guarda dados de cartão.
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text,
  status text,
  plan text check (plan in ('starter', 'pro', 'agency')),
  trial_used boolean not null default false,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Cada evento do Stripe tratado, porque o Stripe pode repetir entregas.
create table public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

create table public.search_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null,
  searches integer not null default 0 check (searches >= 0),
  primary key (user_id, month)
);

-- RLS ativo e sem acesso direto: só as funções abaixo e o servidor.
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.search_usage enable row level security;

revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.stripe_events from anon, authenticated;
revoke all on table public.search_usage from anon, authenticated;
grant select, insert, update on table public.subscriptions to service_role;

-- O início do mês em Lisboa, porque os limites são "por mês" para quem usa.
create function public.lisbon_month_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'Europe/Lisbon')
    at time zone 'Europe/Lisbon';
$$;

-- Só uma subscrição paga em dia dá os limites do pack. Teste, pagamento falhado,
-- subscrição acabada ou conta sem subscrição ficam no limite mais baixo.
create function public.plan_limits(target_user uuid)
returns table (searches integer, demos integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when s.status = 'active' then
      case s.plan when 'starter' then 100 when 'pro' then 400 when 'agency' then 1500 else 10 end
    else 10 end,
    case when s.status = 'active' then
      case s.plan when 'starter' then 10 when 'pro' then 50 when 'agency' then 200 else 2 end
    else 2 end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user;
$$;

revoke execute on function public.plan_limits(uuid) from public, anon, authenticated;

-- Conta a busca antes de a fazer. O bloqueio impede pedidos simultâneos de passar.
create function public.consume_search()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := (select auth.uid());
  current_month date := (now() at time zone 'Europe/Lisbon')::date - (extract(day from now() at time zone 'Europe/Lisbon')::integer - 1);
  used integer;
begin
  if target_user is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('search:' || target_user::text));

  select searches into used
  from public.search_usage
  where user_id = target_user and month = current_month;

  if coalesce(used, 0) >= (select searches from public.plan_limits(target_user)) then
    return false;
  end if;

  insert into public.search_usage (user_id, month, searches)
  values (target_user, current_month, 1)
  on conflict (user_id, month) do update set searches = public.search_usage.searches + 1;

  return true;
end;
$$;

revoke execute on function public.consume_search() from public, anon;
grant execute on function public.consume_search() to authenticated;

-- O que o ecrã de planos precisa, sem expor os identificadores do Stripe.
create function public.my_plan_usage()
returns table (
  status text,
  plan text,
  trial_used boolean,
  trial_end timestamptz,
  cancel_at_period_end boolean,
  has_customer boolean,
  searches_used integer,
  searches_limit integer,
  demos_used integer,
  demos_limit integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.status,
    s.plan,
    coalesce(s.trial_used, false),
    s.trial_end,
    coalesce(s.cancel_at_period_end, false),
    s.user_id is not null,
    coalesce((
      select u.searches from public.search_usage as u
      where u.user_id = (select auth.uid())
        and u.month = (public.lisbon_month_start() at time zone 'Europe/Lisbon')::date
    ), 0),
    limits.searches,
    (
      select count(*)::integer from public.demo_sites as d
      where d.user_id = (select auth.uid())
        and d.created_at >= public.lisbon_month_start()
    ),
    limits.demos
  from public.plan_limits((select auth.uid())) as limits
  left join public.subscriptions as s on s.user_id = (select auth.uid());
$$;

revoke execute on function public.my_plan_usage() from public, anon;
grant execute on function public.my_plan_usage() to authenticated;

-- Marca o evento e atualiza o estado na mesma transação: se algo falhar, o id não
-- fica guardado e a repetição do Stripe volta a tratá-lo. Devolve false se for repetido.
create function public.apply_stripe_subscription_event(
  event_id text,
  event_type text,
  target_user uuid,
  customer_id text,
  subscription_id text,
  new_status text,
  new_plan text,
  had_trial boolean,
  new_trial_end timestamptz,
  new_cancel_at_period_end boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.subscriptions;
begin
  insert into public.stripe_events (id, type)
  values (event_id, event_type)
  on conflict (id) do nothing;

  if not found then
    return false;
  end if;

  -- Conta já apagada: nada a atualizar.
  if not exists (select 1 from auth.users where id = target_user) then
    return true;
  end if;

  select * into existing from public.subscriptions where user_id = target_user;

  -- Um evento de uma subscrição antiga não pode apagar a que está em vigor.
  if existing.stripe_subscription_id is not null
    and existing.stripe_subscription_id <> subscription_id
    and existing.status in ('active', 'trialing', 'past_due', 'unpaid')
    and new_status not in ('active', 'trialing')
  then
    return true;
  end if;

  insert into public.subscriptions (
    user_id, stripe_customer_id, stripe_subscription_id, status, plan,
    trial_used, trial_end, cancel_at_period_end
  )
  values (
    target_user, customer_id, subscription_id, new_status, new_plan,
    had_trial, new_trial_end, new_cancel_at_period_end
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    status = excluded.status,
    plan = excluded.plan,
    trial_used = public.subscriptions.trial_used or excluded.trial_used,
    trial_end = excluded.trial_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  return true;
end;
$$;

revoke execute on function public.apply_stripe_subscription_event(
  text, text, uuid, text, text, text, text, boolean, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(
  text, text, uuid, text, text, text, text, boolean, timestamptz, boolean
) to service_role;

-- O limite das demos passa a seguir o pack.
create or replace function public.enforce_demo_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- O bloqueio impede que dois pedidos simultâneos passem o limite.
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  if (
    select count(*)
    from public.demo_sites
    where user_id = new.user_id
      and created_at >= public.lisbon_month_start()
  ) >= (select demos from public.plan_limits(new.user_id)) then
    raise exception 'demo_limit';
  end if;

  return new;
end;
$$;
