-- CRM: valor da proposta, "não contactar", histórico dos estados e meta diária.
-- Tudo escrito pelo freelancer ou gerado pela base de dados: nada vem do Google.

alter table public.contacts
  add column deal_value numeric(10, 2) check (deal_value >= 0 and deal_value <= 1000000),
  add column do_not_contact boolean not null default false;

grant update (deal_value, do_not_contact) on table public.contacts to authenticated;

-- Histórico: uma linha quando o contacto entra e outra a cada mudança de estado.
-- Escrito só pelo gatilho; o freelancer só lê. Sai com o contacto.
create table public.contact_events (
  id bigint generated always as identity primary key,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('created', 'status')),
  status text not null,
  created_at timestamptz not null default now()
);

create index contact_events_user_created_idx
  on public.contact_events (user_id, created_at desc);
create index contact_events_contact_idx
  on public.contact_events (contact_id, created_at desc);

alter table public.contact_events enable row level security;

grant select on table public.contact_events to authenticated;

create policy "contact_events_select_own"
  on public.contact_events
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.log_contact_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.contact_events (contact_id, user_id, kind, status)
    values (new.id, new.user_id, 'created', new.status);
  elsif new.status is distinct from old.status then
    insert into public.contact_events (contact_id, user_id, kind, status)
    values (new.id, new.user_id, 'status', new.status);
  end if;
  return new;
end;
$$;

revoke execute on function public.log_contact_event() from public, anon, authenticated;

create trigger contacts_log_event
  after insert or update of status on public.contacts
  for each row execute function public.log_contact_event();

-- Os contactos que já existem entram no histórico com a data em que foram guardados.
-- O último contacto, quando houve, conta como "Contactado" nesse dia (para o ritmo).
insert into public.contact_events (contact_id, user_id, kind, status, created_at)
select id, user_id, 'created', 'to_contact', created_at from public.contacts;
insert into public.contact_events (contact_id, user_id, kind, status, created_at)
select id, user_id, 'status', 'contacted', last_contacted_at
from public.contacts
where last_contacted_at is not null;

-- Meta diária: quantas empresas o freelancer quer contactar por dia.
alter table public.profiles
  add column daily_goal smallint not null default 10 check (daily_goal between 1 and 200);

grant update (daily_goal) on table public.profiles to authenticated;
