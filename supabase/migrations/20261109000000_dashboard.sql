-- Painel: o consumo renova no período atual da subscrição, e não a 1 de cada mês.
-- Sem tabelas novas: duas colunas, um índice e funções.
alter table public.subscriptions
  add column current_period_start timestamptz,
  add column current_period_end timestamptz;

create index events_user_type_created_idx
  on public.events (user_id, type, created_at desc);

-- O período em que o consumo conta. Com subscrição, é o do Stripe, e no teste é o
-- próprio teste. Sem subscrição ou com o período já passado, é o mês de calendário.
create function public.usage_period(target_user uuid)
returns table (period_start timestamptz, period_end timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when live.ok then s.current_period_start else public.lisbon_month_start() end,
    case when live.ok then s.current_period_end
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
  ) as live;
$$;

revoke execute on function public.usage_period(uuid) from public, anon, authenticated;

-- A coluna month passa a guardar o dia em que o período começa.
create or replace function public.consume_search()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := (select auth.uid());
  period_key date;
  used integer;
begin
  if target_user is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('search:' || target_user::text));

  select (period_start at time zone 'Europe/Lisbon')::date into period_key
  from public.usage_period(target_user);

  select searches into used
  from public.search_usage
  where user_id = target_user and month = period_key;

  if coalesce(used, 0) >= (select searches from public.plan_limits(target_user)) then
    return false;
  end if;

  insert into public.search_usage (user_id, month, searches)
  values (target_user, period_key, 1)
  on conflict (user_id, month) do update set searches = public.search_usage.searches + 1;

  return true;
end;
$$;

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
      and created_at >= (select period_start from public.usage_period(new.user_id))
  ) >= (select demos from public.plan_limits(new.user_id)) then
    raise exception 'demo_limit';
  end if;

  return new;
end;
$$;

create or replace function public.consume_company_lookup()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := (select auth.uid());
  today date := (now() at time zone 'Europe/Lisbon')::date;
  start_day date;
  limits record;
  used_today integer;
  used_period integer;
begin
  if target_user is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('lookup:' || target_user::text));

  select * into limits from public.plan_lookup_limits(target_user);
  select (period_start at time zone 'Europe/Lisbon')::date into start_day
  from public.usage_period(target_user);

  select
    coalesce(sum(lookups) filter (where day = today), 0),
    coalesce(sum(lookups), 0)
  into used_today, used_period
  from public.company_lookup_usage
  where user_id = target_user and day >= start_day;

  if used_today >= limits.daily or used_period >= limits.monthly then
    return false;
  end if;

  insert into public.company_lookup_usage (user_id, day, lookups)
  values (target_user, today, 1)
  on conflict (user_id, day) do update
    set lookups = public.company_lookup_usage.lookups + 1;

  return true;
end;
$$;

create or replace function public.my_plan_usage()
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
        and u.month = (period.period_start at time zone 'Europe/Lisbon')::date
    ), 0),
    limits.searches,
    (
      select count(*)::integer from public.demo_sites as d
      where d.user_id = (select auth.uid())
        and d.created_at >= period.period_start
    ),
    limits.demos
  from public.plan_limits((select auth.uid())) as limits
  cross join public.usage_period((select auth.uid())) as period
  left join public.subscriptions as s on s.user_id = (select auth.uid());
$$;

-- O evento passa a trazer o período atual da subscrição.
drop function public.apply_stripe_subscription_event(
  text, text, uuid, text, text, text, text, boolean, timestamptz, boolean
);

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
  new_cancel_at_period_end boolean,
  new_period_start timestamptz default null,
  new_period_end timestamptz default null
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
    trial_used, trial_end, cancel_at_period_end,
    current_period_start, current_period_end
  )
  values (
    target_user, customer_id, subscription_id, new_status, new_plan,
    had_trial, new_trial_end, new_cancel_at_period_end,
    new_period_start, new_period_end
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    status = excluded.status,
    plan = excluded.plan,
    trial_used = public.subscriptions.trial_used or excluded.trial_used,
    trial_end = excluded.trial_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    updated_at = now();

  return true;
end;
$$;

revoke execute on function public.apply_stripe_subscription_event(
  text, text, uuid, text, text, text, text, boolean, timestamptz, boolean, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(
  text, text, uuid, text, text, text, text, boolean, timestamptz, boolean, timestamptz, timestamptz
) to service_role;

-- Tudo o que o painel precisa, numa consulta. Sem parâmetros: o utilizador vem sempre
-- de auth.uid(). Só contagens e listas curtas dos dados da própria pessoa, sem ids do
-- Stripe nem dados do Google.
create function public.my_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  period record;
  limits record;
  lookup_limits record;
  start_day date;
  today date := (now() at time zone 'Europe/Lisbon')::date;
begin
  if me is null then
    return null;
  end if;

  select * into period from public.usage_period(me);
  select * into limits from public.plan_limits(me);
  select * into lookup_limits from public.plan_lookup_limits(me);
  start_day := (period.period_start at time zone 'Europe/Lisbon')::date;

  return jsonb_build_object(
    'subscription', (
      select jsonb_build_object(
        'status', s.status,
        'plan', s.plan,
        'trial_end', s.trial_end,
        'trial_used', coalesce(s.trial_used, false),
        'cancel_at_period_end', coalesce(s.cancel_at_period_end, false),
        'has_customer', s.user_id is not null
      )
      from (select 1) as one
      left join public.subscriptions as s on s.user_id = me
    ),
    'usage', jsonb_build_object(
      'period_end', period.period_end,
      'searches_used', coalesce((
        select u.searches from public.search_usage as u
        where u.user_id = me and u.month = start_day
      ), 0),
      'searches_limit', limits.searches,
      'demos_used', (
        select count(*) from public.demo_sites as d
        where d.user_id = me and d.created_at >= period.period_start
      ),
      'demos_limit', limits.demos,
      'lookups_used', coalesce((
        select sum(l.lookups) from public.company_lookup_usage as l
        where l.user_id = me and l.day >= start_day
      ), 0),
      'lookups_limit', lookup_limits.monthly,
      'lookups_today', coalesce((
        select l.lookups from public.company_lookup_usage as l
        where l.user_id = me and l.day = today
      ), 0),
      'lookups_daily_limit', lookup_limits.daily
    ),
    'leads', coalesce((
      select jsonb_object_agg(counts.status, counts.total)
      from (
        select c.status, count(*) as total
        from public.contacts as c
        where c.user_id = me
        group by c.status
      ) as counts
    ), '{}'::jsonb),
    'searches', coalesce((
      select jsonb_agg(recent)
      from (
        select
          e.data->>'service' as service,
          e.data->>'niche' as niche,
          e.data->>'locality' as locality,
          (e.data->>'count')::integer as count,
          e.created_at
        from public.events as e
        where e.user_id = me
          and e.type = 'search'
          and e.data->>'cancelled' = 'false'
        order by e.created_at desc
        limit 5
      ) as recent
    ), '[]'::jsonb),
    'demos', jsonb_build_object(
      'active', (
        select count(*) from public.demo_sites as d
        where d.user_id = me and d.expires_at > now()
      ),
      'items', coalesce((
        select jsonb_agg(soonest)
        from (
          select d.id, d.company_name, d.expires_at
          from public.demo_sites as d
          where d.user_id = me and d.expires_at > now()
          order by d.expires_at
          limit 5
        ) as soonest
      ), '[]'::jsonb)
    )
  );
end;
$$;

revoke execute on function public.my_dashboard() from public, anon;
grant execute on function public.my_dashboard() to authenticated;
