-- Equipa, parte D: o que o servidor (chave secreta, service_role) precisa para o Comercial.
-- Só acrescenta permissões ao servidor; os browsers (anon, authenticated) não ganham nada.
--
-- 1. As mensagens do Comercial usam o link do portfólio publicado do dono e, se ele não
--    tiver modelo próprio, o modelo do WhatsApp do dono. O servidor lê só estes campos.
grant select (user_id, slug, published) on table public.portfolios to service_role;
grant select (id, whatsapp_template) on table public.profiles to service_role;

-- 2. Quando o Comercial fecha um negócio, o servidor cria o projeto do dono (com a
--    checklist e os pagamentos previstos), depois de confirmar que o contacto é do dono.
grant select, insert on table public.client_projects to service_role;
grant insert on table public.project_checklist_items to service_role;
grant insert on table public.client_project_payments to service_role;
