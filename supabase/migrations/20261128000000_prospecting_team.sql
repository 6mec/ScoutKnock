-- T17 fases 3 e 4: pesquisas guardadas do Radar e a estrutura da equipa.
-- Só acrescenta. A equipa fica preparada, mas o acesso aos dados continua só do dono.

-- 1. Pesquisas guardadas do Radar (o que a pessoa escreveu: serviço, nicho e localidade).
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  service text not null check (char_length(service) between 1 and 40),
  niche text not null check (char_length(niche) between 1 and 80),
  locality text not null check (char_length(locality) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (user_id, service, niche, locality)
);

alter table public.saved_searches enable row level security;
revoke all on table public.saved_searches from anon, authenticated;
grant select, delete on table public.saved_searches to authenticated;
grant insert (service, niche, locality) on table public.saved_searches to authenticated;

create policy "saved_searches_select_own" on public.saved_searches
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "saved_searches_insert_own" on public.saved_searches
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saved_searches_delete_own" on public.saved_searches
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 2. Equipa: membros convidados pelo dono, com uma função. Hoje só existe o dono, que não
--    precisa de linha aqui (é sempre administrador). Os convites ficam "pendentes": não são
--    enviados enquanto os registos e os emails estiverem desligados.
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null default 'sales' check (role in ('admin', 'sales', 'read_only')),
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  -- Preenchido quando a pessoa entrar (no futuro, com os registos abertos).
  member_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);

alter table public.team_members enable row level security;
revoke all on table public.team_members from anon, authenticated;
grant select, delete on table public.team_members to authenticated;
grant insert (email, role) on table public.team_members to authenticated;
grant update (role) on table public.team_members to authenticated;

create policy "team_members_select_own" on public.team_members
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "team_members_insert_own" on public.team_members
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "team_members_update_own" on public.team_members
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "team_members_delete_own" on public.team_members
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- 3. Responsável (opcional) por contactos e projetos, para quando houver equipa. Vazio é
--    "o dono": a solo nada muda. As regras de acesso continuam só para o dono.
alter table public.contacts add column assigned_to uuid references auth.users (id) on delete set null;
alter table public.client_projects add column assigned_to uuid references auth.users (id) on delete set null;
grant update (assigned_to) on table public.contacts to authenticated;
grant update (assigned_to) on table public.client_projects to authenticated;
