-- Frase do trabalho no portfólio: de 160 para 240 caracteres (cabem 2 a 3 linhas no cartão).
-- A linha de cada serviço (160) é só verificada na app, porque os serviços estão em jsonb.
alter table public.client_projects drop constraint if exists client_projects_portfolio_summary_check;
alter table public.client_projects
  add constraint client_projects_portfolio_summary_check check (char_length(portfolio_summary) <= 240);
