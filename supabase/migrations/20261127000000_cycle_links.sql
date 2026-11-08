-- T17 fase 2: ligações do ciclo (proposta → projeto → entrega → portfólio → manutenção).
-- Só acrescenta: tabelas novas, colunas novas e regras mais largas. Nada é apagado e os
-- dados que já existem ficam válidos (pagamentos como "recebidos", fases a partir do estado).

-- 1. Propostas registadas na ficha do contacto. O documento para imprimir continua no
--    browser; aqui fica só o que alimenta os números (serviço, valor, sinal, validade, estado).
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  service text not null check (char_length(service) between 1 and 160),
  value numeric(10, 2) not null check (value >= 0 and value <= 1000000),
  deposit numeric(10, 2) check (deposit >= 0 and deposit <= 1000000),
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'refused')),
  -- Preenchidas pelo gatilho quando o estado muda (dia de Lisboa).
  sent_on date,
  decided_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_deposit_within_value check (deposit is null or deposit <= value)
);

create index proposals_user_idx on public.proposals (user_id, created_at desc);
create index proposals_contact_idx on public.proposals (contact_id);

alter table public.proposals enable row level security;
revoke all on table public.proposals from anon, authenticated;
grant select, delete on table public.proposals to authenticated;
grant insert (contact_id, service, value, deposit, valid_until, status) on table public.proposals to authenticated;
grant update (service, value, deposit, valid_until, status) on table public.proposals to authenticated;

create policy "proposals_select_own" on public.proposals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "proposals_insert_own" on public.proposals
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = (select auth.uid()))
  );
create policy "proposals_update_own" on public.proposals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "proposals_delete_own" on public.proposals
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.touch_proposal()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Europe/Lisbon')::date;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') and new.sent_on is null then
    new.sent_on := today;
  end if;
  if new.status in ('accepted', 'refused') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.decided_on := today;
    new.sent_on := coalesce(new.sent_on, today);
  end if;
  if new.status in ('draft', 'sent') then
    new.decided_on := null;
  end if;
  return new;
end;
$$;

create trigger proposals_touch
  before insert or update on public.proposals
  for each row execute function public.touch_proposal();

-- 2. Projetos: a proposta de onde vieram, a fase, o próximo passo, a origem (fonte,
--    nicho e zona, copiados da ficha quando o projeto nasce) e o rascunho para o portfólio.
alter table public.client_projects
  add column proposal_id uuid unique references public.proposals (id) on delete set null,
  add column phase text check (phase in ('accepted', 'briefing', 'design', 'development', 'review', 'delivery', 'maintenance')),
  add column next_step text check (char_length(next_step) <= 200),
  add column origin_source text check (origin_source in ('osm', 'manual', 'google', 'other')),
  add column origin_niche text check (char_length(origin_niche) <= 80),
  add column origin_locality text check (char_length(origin_locality) <= 80),
  add column portfolio_draft boolean not null default false;

-- A fase dos projetos que já existem, pelo estado de hoje ("pedido" fica sem fase).
update public.client_projects set phase = case status
  when 'in_progress' then 'development'
  when 'delivered' then 'delivery'
  when 'finished' then 'delivery'
  when 'maintenance' then 'maintenance'
  else null
end
where phase is null;

grant insert (proposal_id, phase, next_step, origin_source, origin_niche, origin_locality, portfolio_draft)
  on table public.client_projects to authenticated;
grant update (phase, next_step, portfolio_draft) on table public.client_projects to authenticated;

-- A proposta, se vier, também tem de ser de quem cria o projeto.
drop policy "client_projects_insert_own" on public.client_projects;
create policy "client_projects_insert_own" on public.client_projects
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (contact_id is null or exists (
      select 1 from public.contacts c where c.id = contact_id and c.user_id = (select auth.uid())
    ))
    and (work_request_id is null or exists (
      select 1 from public.work_requests r where r.id = work_request_id and r.user_id = (select auth.uid())
    ))
    and (proposal_id is null or exists (
      select 1 from public.proposals pr where pr.id = proposal_id and pr.user_id = (select auth.uid())
    ))
  );

-- 3. Checklist de cada projeto (o modelo vem da app; aqui ficam os itens de cada um).
create table public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.client_projects (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  done boolean not null default false,
  position smallint not null default 0 check (position between 0 and 200),
  -- Itens com efeito: "pedir opinião" cria o rascunho do trabalho no portfólio.
  kind text check (kind in ('ask_testimonial')),
  created_at timestamptz not null default now()
);

create index project_checklist_items_project_idx on public.project_checklist_items (project_id, position);

alter table public.project_checklist_items enable row level security;
revoke all on table public.project_checklist_items from anon, authenticated;
grant select, delete on table public.project_checklist_items to authenticated;
grant insert (project_id, label, done, position, kind) on table public.project_checklist_items to authenticated;
grant update (label, done, position) on table public.project_checklist_items to authenticated;

create policy "project_checklist_items_select_own" on public.project_checklist_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "project_checklist_items_insert_own" on public.project_checklist_items
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.client_projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
create policy "project_checklist_items_update_own" on public.project_checklist_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "project_checklist_items_delete_own" on public.project_checklist_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 4. Pagamentos: passam a poder ser previstos (sinal, final, manutenção) e depois
--    marcados como recebidos. Os que já existem são todos recebidos.
alter table public.client_project_payments
  add column status text not null default 'received' check (status in ('expected', 'received')),
  add column due_on date;
alter table public.client_project_payments alter column paid_on drop not null;
alter table public.client_project_payments
  add constraint client_project_payments_received_has_date check (status = 'expected' or paid_on is not null);
alter table public.client_project_payments drop constraint client_project_payments_kind_check;
alter table public.client_project_payments
  add constraint client_project_payments_kind_check check (kind in ('build', 'deposit', 'final', 'maintenance'));

grant insert (status, due_on) on table public.client_project_payments to authenticated;
grant update (status, paid_on, amount, due_on, note) on table public.client_project_payments to authenticated;

create policy "client_project_payments_update_own" on public.client_project_payments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. Empresas do OpenStreetMap: a ficha pode guardar também o nicho e a zona da busca
--    (dados abertos, licença ODbL), para o projeto saber de onde veio.
alter table public.contacts drop constraint contacts_manual_fields_only_manual;
alter table public.contacts
  add constraint contacts_manual_fields_only_manual check (
    company_id like 'manual-%'
    or (
      company_id like 'osm-%'
      and manual_website is null and manual_reviews is null and manual_hours is null
    )
    or (
      manual_niche is null and manual_locality is null and manual_address is null
      and manual_phone is null and manual_website is null
      and manual_reviews is null and manual_hours is null
    )
  );

-- 6. Sites demo: o que for "exemplo do nicho" pode ir no {link_demo} das mensagens a
--    empresas do mesmo nicho que não têm demo própria.
alter table public.demo_sites add column niche_example boolean not null default false;
grant update (niche_example) on table public.demo_sites to authenticated;
