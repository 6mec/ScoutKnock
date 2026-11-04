-- Projetos por cliente: o trabalho definitivo que o Daniel faz para uma empresa.
-- Guarda só o que ele escreve: estado, os três valores em euros (criação, custos de
-- terceiros pagos pelo cliente e manutenção mensal), datas e notas. Não cobra, não
-- emite faturas, não calcula impostos e não guarda dados dos clientes da empresa.
create table public.client_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  work_request_id uuid references public.work_requests (id) on delete set null,
  company_name text not null check (char_length(company_name) between 1 and 120),
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('site', 'site_booking', 'app', 'other')),
  status text not null default 'requested'
    check (status in ('requested', 'in_progress', 'delivered', 'maintenance', 'finished')),
  build_value numeric(10, 2) check (build_value >= 0 and build_value <= 1000000),
  third_party_value numeric(10, 2) check (third_party_value >= 0 and third_party_value <= 1000000),
  third_party_note text check (char_length(third_party_note) <= 300),
  maintenance_monthly numeric(10, 2) check (maintenance_monthly >= 0 and maintenance_monthly <= 1000000),
  start_date date,
  due_date date,
  delivered_on date,
  maintenance_since date,
  link text check (char_length(link) <= 300),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date),
  check (delivered_on is null or start_date is null or delivered_on >= start_date)
);

create index client_projects_user_idx on public.client_projects (user_id, created_at desc);
create index client_projects_contact_idx on public.client_projects (contact_id);

alter table public.client_projects enable row level security;
revoke all on table public.client_projects from anon, authenticated;

grant select, delete on table public.client_projects to authenticated;
grant insert (
  contact_id, work_request_id, company_name, name, kind, status,
  build_value, third_party_value, third_party_note, maintenance_monthly,
  start_date, due_date, delivered_on, maintenance_since, link, notes
) on table public.client_projects to authenticated;
-- O dono, a ficha e o pedido de origem não mudam depois de criado.
grant update (
  company_name, name, kind, status,
  build_value, third_party_value, third_party_note, maintenance_monthly,
  start_date, due_date, delivered_on, maintenance_since, link, notes
) on table public.client_projects to authenticated;

create policy "client_projects_select_own" on public.client_projects
  for select to authenticated using ((select auth.uid()) = user_id);

-- A ficha e o pedido, se vierem, têm de ser da mesma pessoa.
create policy "client_projects_insert_own" on public.client_projects
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (contact_id is null or exists (
      select 1 from public.contacts c where c.id = contact_id and c.user_id = (select auth.uid())
    ))
    and (work_request_id is null or exists (
      select 1 from public.work_requests r where r.id = work_request_id and r.user_id = (select auth.uid())
    ))
  );

create policy "client_projects_update_own" on public.client_projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "client_projects_delete_own" on public.client_projects
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.touch_client_project()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger client_projects_touch
  before update on public.client_projects
  for each row execute function public.touch_client_project();

-- Histórico: uma linha quando o projeto é criado e outra a cada mudança de estado.
-- Escrito só pelo gatilho; o Daniel só lê. Sai com o projeto.
create table public.client_project_events (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.client_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('created', 'status')),
  status text not null,
  created_at timestamptz not null default now()
);

create index client_project_events_project_idx
  on public.client_project_events (project_id, created_at desc);
create index client_project_events_user_idx
  on public.client_project_events (user_id, created_at desc);

alter table public.client_project_events enable row level security;
revoke all on table public.client_project_events from anon, authenticated;
grant select on table public.client_project_events to authenticated;

create policy "client_project_events_select_own" on public.client_project_events
  for select to authenticated using (user_id = (select auth.uid()));

create function public.log_client_project_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.client_project_events (project_id, user_id, kind, status)
    values (new.id, new.user_id, 'created', new.status);
  elsif new.status is distinct from old.status then
    insert into public.client_project_events (project_id, user_id, kind, status)
    values (new.id, new.user_id, 'status', new.status);
  end if;
  return new;
end;
$$;

revoke execute on function public.log_client_project_event() from public, anon, authenticated;

create trigger client_projects_log_event
  after insert or update of status on public.client_projects
  for each row execute function public.log_client_project_event();
