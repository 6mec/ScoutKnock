-- Limites provisórios que cumprem os 30% no pior caso, até medir o custo real.
-- Têm de bater certo com PLANS em src/lib/account/rules.ts.
create or replace function public.plan_limits(target_user uuid)
returns table (searches integer, demos integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when s.status = 'active' then
      case s.plan when 'starter' then 100 when 'pro' then 150 when 'agency' then 245 else 10 end
    else 10 end,
    case when s.status = 'active' then
      case s.plan when 'starter' then 10 when 'pro' then 50 when 'agency' then 200 else 2 end
    else 2 end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user;
$$;

-- O teto mensal é preciso porque o diário, num mês de 31 dias, passaria o limite de custo.
create function public.plan_lookup_limits(target_user uuid)
returns table (daily integer, monthly integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when s.status = 'active' then
      case s.plan when 'starter' then 3 when 'pro' then 10 when 'agency' then 25 else 3 end
    else 3 end,
    case when s.status = 'active' then
      case s.plan when 'starter' then 90 when 'pro' then 300 when 'agency' then 750 else 90 end
    else 90 end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user;
$$;

revoke execute on function public.plan_lookup_limits(uuid) from public, anon, authenticated;

create or replace function public.consume_company_lookup()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := (select auth.uid());
  today date := (now() at time zone 'Europe/Lisbon')::date;
  month_start date := date_trunc('month', today)::date;
  limits record;
  used_today integer;
  used_month integer;
begin
  if target_user is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('lookup:' || target_user::text));

  select * into limits from public.plan_lookup_limits(target_user);

  select
    coalesce(sum(lookups) filter (where day = today), 0),
    coalesce(sum(lookups), 0)
  into used_today, used_month
  from public.company_lookup_usage
  where user_id = target_user and day >= month_start;

  if used_today >= limits.daily or used_month >= limits.monthly then
    return false;
  end if;

  insert into public.company_lookup_usage (user_id, day, lookups)
  values (target_user, today, 1)
  on conflict (user_id, day) do update
    set lookups = public.company_lookup_usage.lookups + 1;

  return true;
end;
$$;

drop function public.plan_daily_lookups(uuid);
