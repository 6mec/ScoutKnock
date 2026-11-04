-- Pedidos de trabalho: o freelancer pede um site, um site com marcações ou uma app
-- para uma empresa, e o Claude Code trata deles com o comando /pedidos (pela chave de
-- serviço, só no computador do Daniel). Guarda só o que o freelancer escreve.
create table public.work_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  demo_id uuid references public.demo_sites (id) on delete set null,
  company_name text not null check (char_length(company_name) between 1 and 120),
  kind text not null check (kind in ('site', 'site_booking', 'app')),
  brief text not null check (char_length(brief) between 1 and 4000),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  -- Escritos por quem faz o trabalho: o que foi feito e onde ver.
  result_note text check (char_length(result_note) <= 2000),
  result_url text check (char_length(result_url) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_requests_user_idx on public.work_requests (user_id, created_at desc);
create index work_requests_pending_idx on public.work_requests (status) where status in ('pending', 'in_progress');

alter table public.work_requests enable row level security;
revoke all on table public.work_requests from anon, authenticated;

grant select on table public.work_requests to authenticated;
grant insert (contact_id, demo_id, company_name, kind, brief) on table public.work_requests to authenticated;
-- O freelancer pode corrigir o pedido e cancelá-lo; o resultado só o escreve o servidor.
grant update (brief, status) on table public.work_requests to authenticated;
grant delete on table public.work_requests to authenticated;
grant select, update on table public.work_requests to service_role;

create policy "work_requests_select_own" on public.work_requests
  for select to authenticated using ((select auth.uid()) = user_id);

-- A ficha e a demo, se vierem, têm de ser da mesma pessoa.
create policy "work_requests_insert_own" on public.work_requests
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (contact_id is null or exists (
      select 1 from public.contacts c where c.id = contact_id and c.user_id = (select auth.uid())
    ))
    and (demo_id is null or exists (
      select 1 from public.demo_sites d where d.id = demo_id and d.user_id = (select auth.uid())
    ))
  );

-- Pela app, só se edita um pedido por fazer, e só para o cancelar ou mudar o texto.
create policy "work_requests_update_own" on public.work_requests
  for update to authenticated
  using ((select auth.uid()) = user_id and status = 'pending')
  with check ((select auth.uid()) = user_id and status in ('pending', 'cancelled'));

create policy "work_requests_delete_own" on public.work_requests
  for delete to authenticated using ((select auth.uid()) = user_id and status in ('pending', 'cancelled', 'done'));

create function public.touch_work_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger work_requests_touch
  before update on public.work_requests
  for each row execute function public.touch_work_request();

-- O /pedidos (chave de serviço, só no computador do Daniel) lê a ficha e a demo do
-- pedido e escreve os textos da demo. Só estes campos: nunca o dono, o endereço nem a validade.
grant select on table public.contacts to service_role;
grant select on table public.demo_sites to service_role;
grant update (
  headline, intro, subheadline, cta_label, about, services, highlights,
  booking_enabled, booking_hours, accent_color, template, niche_style
) on table public.demo_sites to service_role;
