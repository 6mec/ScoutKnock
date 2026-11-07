-- Pagamentos recebidos por projeto: registo manual do que o Daniel recebeu (valor, data,
-- se foi da criação ou da manutenção, e uma nota curta). Serve só para o "a receber" e o
-- gráfico do Início. Não emite faturas, não calcula impostos e não liga a pagamentos.
-- Não se editam: apaga-se e regista-se outra vez. Saem com o projeto.
create table public.client_project_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.client_projects (id) on delete cascade,
  kind text not null check (kind in ('build', 'maintenance')),
  amount numeric(10, 2) not null check (amount > 0 and amount <= 1000000),
  paid_on date not null,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create index client_project_payments_user_idx on public.client_project_payments (user_id, paid_on desc);
create index client_project_payments_project_idx on public.client_project_payments (project_id);

alter table public.client_project_payments enable row level security;
revoke all on table public.client_project_payments from anon, authenticated;

grant select, delete on table public.client_project_payments to authenticated;
grant insert (project_id, kind, amount, paid_on, note) on table public.client_project_payments to authenticated;

create policy "client_project_payments_select_own" on public.client_project_payments
  for select to authenticated using ((select auth.uid()) = user_id);

-- O projeto tem de ser de quem regista o pagamento.
create policy "client_project_payments_insert_own" on public.client_project_payments
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.client_projects p where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

create policy "client_project_payments_delete_own" on public.client_project_payments
  for delete to authenticated using ((select auth.uid()) = user_id);
