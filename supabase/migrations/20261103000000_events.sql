-- Papel de administrador. Authenticated só pode alterar display_name e locale,
-- por isso este campo só muda diretamente na base de dados.
alter table public.profiles add column is_admin boolean not null default false;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- O que aconteceu. Só o necessário em data, nunca emails nem conteúdo de utilizadores.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  type text not null check (type in (
    'signup', 'search', 'demo_created', 'demo_published',
    'subscription_started', 'payment_failed', 'error'
  )),
  data jsonb not null default '{}' check (pg_column_size(data) <= 2048)
);

create index events_created_at_idx on public.events (created_at desc);
create index events_type_created_at_idx on public.events (type, created_at desc);

-- Quanto custou cada chamada paga.
create table public.api_costs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null check (provider in (
    'google_places', 'claude', 'resend', 'vercel', 'supabase'
  )),
  kind text not null check (char_length(kind) <= 80),
  units numeric not null check (units >= 0),
  cost_eur numeric(12, 6) not null check (cost_eur >= 0)
);

create index api_costs_created_at_idx on public.api_costs (created_at desc);
create index api_costs_user_created_at_idx on public.api_costs (user_id, created_at desc);

-- RLS ativo. Os utilizadores não escrevem: só o servidor, com a chave secreta.
alter table public.events enable row level security;
alter table public.api_costs enable row level security;

revoke all on table public.events from anon, authenticated;
revoke all on table public.api_costs from anon, authenticated;
grant select on table public.events to authenticated;
grant select on table public.api_costs to authenticated;
grant select, insert on table public.events to service_role;
grant select, insert on table public.api_costs to service_role;

create policy "events_select_admin"
  on public.events
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "api_costs_select_admin"
  on public.api_costs
  for select
  to authenticated
  using ((select public.is_admin()));
