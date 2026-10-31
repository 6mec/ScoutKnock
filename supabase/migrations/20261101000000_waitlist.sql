-- Lista de espera da landing page. Só o servidor acede, com a chave secreta.
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) <= 254),
  service text check (service in ('sites', 'social_media', 'design', 'marketing', 'other')),
  locale text not null default 'pt-PT' check (locale in ('pt-PT', 'pt-BR', 'en')),
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  consent_version text not null,
  consent_at timestamptz not null default now(),
  confirmed_at timestamptz,
  last_email_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Índice para contar os envios das últimas 24 horas.
create index waitlist_last_email_sent_at_idx on public.waitlist (last_email_sent_at);

-- RLS ativo e sem políticas: pela chave pública ninguém lê nem escreve.
alter table public.waitlist enable row level security;

revoke all on table public.waitlist from anon, authenticated;
grant select, insert, update, delete on table public.waitlist to service_role;

-- Quem não confirmar ao fim de 30 dias é apagado.
create extension if not exists pg_cron;

select cron.schedule(
  'waitlist-purge-pending',
  '0 3 * * *',
  $$delete from public.waitlist where status = 'pending' and created_at < now() - interval '30 days'$$
);
