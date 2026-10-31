-- Termos do Google: os dados da demo passam a ser os que o freelancer escreve.
-- A unicidade mantém-se por utilizador e empresa: unique (user_id, company_id).

-- As demos existentes ficam como estão, o que só é aceitável para dados de exemplo:
-- dados reais param aqui, sem mudar nada.
do $$
begin
  if exists (select 1 from public.demo_sites where company_id !~ '^sample-') then
    raise exception 'demos_com_dados_nao_exemplo';
  end if;
end;
$$;

comment on column public.demo_sites.company_id is 'place_id do Google, ou id de exemplo em desenvolvimento. Os restantes dados são escritos pelo freelancer.';

grant update (niche, locality, address, phone) on table public.demo_sites to authenticated;

-- Só o servidor: para suporte e para testar o teto mensal sem esperar um mês.
grant select, insert on table public.company_lookup_usage to service_role;
