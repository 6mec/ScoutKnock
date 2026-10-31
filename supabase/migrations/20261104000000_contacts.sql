-- Contactos (CRM). Só dados públicos e comerciais da empresa, mais o trabalho do freelancer.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id text not null check (char_length(company_id) <= 200),
  company_name text not null check (char_length(company_name) between 1 and 120),
  niche text not null check (char_length(niche) <= 80),
  locality text not null check (char_length(locality) <= 80),
  address text not null check (char_length(address) <= 200),
  phone text check (char_length(phone) <= 40),
  website text check (char_length(website) <= 300),
  score integer not null check (score between 0 and 100),
  status text not null default 'to_contact' check (status in (
    'to_contact', 'contacted', 'replied', 'proposal', 'won', 'lost'
  )),
  last_contacted_at timestamptz,
  next_action text check (char_length(next_action) <= 200),
  next_action_at date,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create index contacts_user_created_idx on public.contacts (user_id, created_at desc);

-- RLS ativo: cada pessoa só acede aos seus contactos.
alter table public.contacts enable row level security;

-- Os dados da empresa e a nota não se alteram depois de guardados.
revoke all on table public.contacts from anon, authenticated;
grant select, delete on table public.contacts to authenticated;
grant insert (
  user_id, company_id, company_name, niche, locality, address, phone, website, score
) on table public.contacts to authenticated;
grant update (
  status, last_contacted_at, next_action, next_action_at, notes
) on table public.contacts to authenticated;

create policy "contacts_select_own"
  on public.contacts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "contacts_insert_own"
  on public.contacts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "contacts_update_own"
  on public.contacts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "contacts_delete_own"
  on public.contacts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();
