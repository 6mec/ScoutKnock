-- Termos do Google: os contactos guardam só o place_id e o que o freelancer escreve.
-- Notas, estados, último contacto e próxima ação ficam como estão.

-- Copiar o nome só é aceitável para dados de exemplo: dados reais param aqui, sem
-- mudar nada, porque toda a migração corre numa transação.
do $$
begin
  if exists (select 1 from public.contacts where company_id !~ '^sample-') then
    raise exception 'contacts_com_dados_nao_exemplo';
  end if;
end;
$$;

alter table public.contacts
  add column label text,
  add column confirmed_contact text check (char_length(confirmed_contact) <= 200);

update public.contacts set label = left(company_name, 120);

alter table public.contacts
  alter column label set not null,
  add constraint contacts_label_length check (char_length(label) between 1 and 120);

alter table public.contacts
  drop column company_name,
  drop column niche,
  drop column locality,
  drop column address,
  drop column phone,
  drop column website,
  drop column score;

comment on column public.contacts.company_id is 'place_id do Google, ou id de exemplo em desenvolvimento.';

grant insert (label) on table public.contacts to authenticated;
grant update (label, confirmed_contact) on table public.contacts to authenticated;

-- Consultas pagas de detalhes por dia. Sem acesso direto: só a função abaixo.
create table public.company_lookup_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  lookups integer not null default 0 check (lookups >= 0),
  primary key (user_id, day)
);

alter table public.company_lookup_usage enable row level security;
revoke all on table public.company_lookup_usage from anon, authenticated;

-- Tem de bater certo com PLANS em src/lib/account/rules.ts.
create function public.plan_daily_lookups(target_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when s.status = 'active' then
    case s.plan when 'starter' then 3 when 'pro' then 10 when 'agency' then 25 else 3 end
  else 3 end
  from (select 1) as one
  left join public.subscriptions as s on s.user_id = target_user;
$$;

revoke execute on function public.plan_daily_lookups(uuid) from public, anon, authenticated;

-- Conta antes da chamada paga. O bloqueio impede pedidos simultâneos de passar.
create function public.consume_company_lookup()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid := (select auth.uid());
  today date := (now() at time zone 'Europe/Lisbon')::date;
  used integer;
begin
  if target_user is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('lookup:' || target_user::text));

  select lookups into used
  from public.company_lookup_usage
  where user_id = target_user and day = today;

  if coalesce(used, 0) >= public.plan_daily_lookups(target_user) then
    return false;
  end if;

  insert into public.company_lookup_usage (user_id, day, lookups)
  values (target_user, today, 1)
  on conflict (user_id, day) do update
    set lookups = public.company_lookup_usage.lookups + 1;

  return true;
end;
$$;

revoke execute on function public.consume_company_lookup() from public, anon;
grant execute on function public.consume_company_lookup() to authenticated;
