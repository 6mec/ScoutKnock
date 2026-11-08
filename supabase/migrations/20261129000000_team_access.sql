-- Equipa, parte C: um membro "Comercial" (role 'sales') trabalha a prospeção do dono.
-- Só acrescenta. As regras do dono ficam iguais; somam-se regras novas que só valem para
-- quem tem um convite ativo, ligado à sua conta, com o email confirmado e igual ao do
-- convite. Para quem trabalha sozinho, nada muda (as funções devolvem a própria pessoa).
--
-- O Comercial pode: ler, criar e atualizar contactos, o histórico, propostas, demos,
-- pedidos de trabalho e pesquisas guardadas do Radar; usar o Radar com os limites do dono.
-- Não pode: apagar nada; ver projetos, pagamentos, checklist, portfólio, opiniões, equipa,
-- subscrição nem o consumo. Tudo o que cria fica do dono (user_id = dono).

-- 1. Um membro ativo pertence a uma só equipa.
create unique index team_members_one_active_team
  on public.team_members (member_id)
  where status = 'active' and member_id is not null;

-- 2. De quem é a prospeção que eu trabalho como Comercial (ou null se não sou).
--    Confirma sempre na conta: email confirmado e ainda igual ao do convite.
create function public.sales_owner()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tm.owner_id
  from public.team_members as tm
  join auth.users as u on u.id = tm.member_id
  where tm.member_id = (select auth.uid())
    and tm.status = 'active'
    and tm.role = 'sales'
    and tm.owner_id <> tm.member_id
    and u.email_confirmed_at is not null
    and lower(u.email) = lower(tm.email)
  limit 1;
$$;

revoke execute on function public.sales_owner() from public, anon;
grant execute on function public.sales_owner() to authenticated, service_role;

-- Em nome de quem escrevo: o dono, se sou Comercial; senão, eu próprio.
create function public.my_workspace()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.sales_owner(), (select auth.uid()));
$$;

revoke execute on function public.my_workspace() from public, anon;
grant execute on function public.my_workspace() to authenticated, service_role;

-- 3. Aceitar o convite: liga a conta que entrou ao convite com o mesmo email.
--    Serve para a conta criada pelo convite do Supabase e para a criada à mão
--    ("Create new user" com "Auto Confirm User"). Sem email confirmado, não aceita.
--    Devolve 'ok', 'already' (já ligado), 'unconfirmed' ou 'none'.
create function public.accept_team_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  my_email text;
  confirmed boolean;
  invite uuid;
begin
  if me is null then
    return 'none';
  end if;

  if exists (select 1 from public.team_members where member_id = me and status = 'active') then
    return 'already';
  end if;

  select lower(u.email), u.email_confirmed_at is not null into my_email, confirmed
  from auth.users as u where u.id = me;

  if my_email is null then
    return 'none';
  end if;

  select tm.id into invite
  from public.team_members as tm
  where lower(tm.email) = my_email
    and tm.status = 'invited'
    and tm.member_id is null
    and tm.owner_id <> me
  order by tm.created_at
  limit 1
  for update;

  if invite is null then
    return 'none';
  end if;
  if not confirmed then
    return 'unconfirmed';
  end if;

  update public.team_members set member_id = me, status = 'active' where id = invite;
  return 'ok';
end;
$$;

revoke execute on function public.accept_team_invite() from public, anon;
grant execute on function public.accept_team_invite() to authenticated;

-- 4. O que o Comercial cria sem indicar o dono fica do dono.
alter table public.proposals alter column user_id set default public.my_workspace();
alter table public.saved_searches alter column user_id set default public.my_workspace();
alter table public.work_requests alter column user_id set default public.my_workspace();

-- 5. Regras novas, só para o Comercial (as do dono não mudam). Sem delete.
create policy "contacts_select_sales" on public.contacts
  for select to authenticated using (user_id = (select public.sales_owner()));
create policy "contacts_insert_sales" on public.contacts
  for insert to authenticated with check (user_id = (select public.sales_owner()));
create policy "contacts_update_sales" on public.contacts
  for update to authenticated
  using (user_id = (select public.sales_owner()))
  with check (user_id = (select public.sales_owner()));

create policy "contact_events_select_sales" on public.contact_events
  for select to authenticated using (user_id = (select public.sales_owner()));

create policy "proposals_select_sales" on public.proposals
  for select to authenticated using (user_id = (select public.sales_owner()));
create policy "proposals_insert_sales" on public.proposals
  for insert to authenticated with check (
    user_id = (select public.sales_owner())
    and exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = (select public.sales_owner()))
  );
create policy "proposals_update_sales" on public.proposals
  for update to authenticated
  using (user_id = (select public.sales_owner()))
  with check (user_id = (select public.sales_owner()));

create policy "demo_sites_select_sales" on public.demo_sites
  for select to authenticated using (user_id = (select public.sales_owner()));
create policy "demo_sites_insert_sales" on public.demo_sites
  for insert to authenticated with check (user_id = (select public.sales_owner()));
create policy "demo_sites_update_sales" on public.demo_sites
  for update to authenticated
  using (user_id = (select public.sales_owner()))
  with check (user_id = (select public.sales_owner()));

create policy "work_requests_select_sales" on public.work_requests
  for select to authenticated using (user_id = (select public.sales_owner()));
create policy "work_requests_insert_sales" on public.work_requests
  for insert to authenticated with check (
    user_id = (select public.sales_owner())
    and (contact_id is null or exists (
      select 1 from public.contacts c where c.id = contact_id and c.user_id = (select public.sales_owner())
    ))
    and (demo_id is null or exists (
      select 1 from public.demo_sites d where d.id = demo_id and d.user_id = (select public.sales_owner())
    ))
  );
create policy "work_requests_update_sales" on public.work_requests
  for update to authenticated
  using (user_id = (select public.sales_owner()) and status = 'pending')
  with check (user_id = (select public.sales_owner()) and status in ('pending', 'cancelled'));

create policy "saved_searches_select_sales" on public.saved_searches
  for select to authenticated using (user_id = (select public.sales_owner()));
create policy "saved_searches_insert_sales" on public.saved_searches
  for insert to authenticated with check (user_id = (select public.sales_owner()));

-- 6. O Radar do Comercial conta nos limites do dono (iguais aos de 20261109; só muda
--    target_user, que para quem está sozinho continua a ser a própria pessoa).
create or replace function public.consume_search()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := public.my_workspace();
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

create or replace function public.consume_company_lookup()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := public.my_workspace();
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
