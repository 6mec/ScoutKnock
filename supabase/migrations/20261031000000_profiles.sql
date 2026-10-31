-- Perfil de cada utilizador. Criado por trigger no registo e apagado com a conta.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  locale text not null default 'pt-PT' check (locale in ('pt-PT', 'pt-BR', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS ativo: sem política, ninguém acede.
alter table public.profiles enable row level security;

-- Permissões mínimas: anónimos nada; autenticados leem e alteram só estas colunas.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, locale) on table public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Sem políticas de insert e delete: o trigger cria o perfil e a cascata apaga-o.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Contas que já existiam antes desta migração.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
