-- Verificação dos sites: não tem custo de API, mas conta para o teto diário do projeto.
-- Regista só contagens, nunca endereços nem resultados.
alter table public.api_costs drop constraint api_costs_provider_check;
alter table public.api_costs add constraint api_costs_provider_check check (provider in (
  'google_places', 'claude', 'resend', 'vercel', 'supabase', 'site_check'
));

alter table public.events drop constraint events_type_check;
alter table public.events add constraint events_type_check check (type in (
  'signup', 'search', 'demo_created', 'demo_published',
  'subscription_started', 'payment_failed', 'error', 'site_checks'
));
