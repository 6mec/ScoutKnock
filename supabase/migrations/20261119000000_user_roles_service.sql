-- A chave de serviço (só no servidor, nunca no browser) passa a poder gerir os papéis.
-- Os browsers continuam sem acesso: só a função am_i_admin responde, e só pela própria
-- pessoa. Serve para ferramentas do servidor e para os testes com contas temporárias.
grant select, insert, delete on public.user_roles to service_role;
