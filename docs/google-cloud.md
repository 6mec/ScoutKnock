# Google Cloud — como ativar o Places sem sustos de custo

Guia para o Daniel. Objetivo: ligar a Google Places API (nova) ao ScoutKnock com limites que impedem uma fatura inesperada.

**Duas verdades a ter sempre presentes**
1. Um **orçamento** (budget) do Google Cloud **só avisa**, não corta o gasto. Quem corta são as **quotas** (limites diários da API) e o **travão de custo no código** (passo 7).
2. A chave da API **nunca** aparece no chat nem no código. Vive só no `.env.local` (e nas variáveis da Vercel).

Preços: confirmar sempre na página oficial antes de decidir limites (https://developers.google.com/maps/billing-and-pricing/pricing). Valores vistos a 28/10/2026 (podem ter mudado): Text Search Pro 5000 pedidos grátis/mês e 32 $ por 1000 depois; Text Search Enterprise 1000 grátis/mês e 35 $ por 1000 depois. Campos como site, telefone, avaliações e horário contam provavelmente no escalão Enterprise, que é o que o radar precisa.

## 1. Criar o projeto
1. Entra em https://console.cloud.google.com com a conta Google do projeto.
2. Topo da página → seletor de projetos → **Novo projeto** → nome `scoutknock` → Criar.
3. Confirma que o projeto `scoutknock` está selecionado no topo.

## 2. Ativar a faturação
1. Menu → **Faturação** → ligar uma conta de faturação (pede cartão). É obrigatório para usar o Places, mesmo dentro do grátis.
2. Contas novas costumam ter crédito de boas-vindas: lê as condições no ecrã e não contes com ele para decidir limites.

## 3. Ativar só a API certa
1. Menu → **APIs e serviços → Biblioteca**.
2. Procura **Places API (New)** → **Ativar**.
3. Não ativas mais nada. Cada API extra é uma porta aberta.

## 4. Criar a chave e restringi-la
1. **APIs e serviços → Credenciais → Criar credenciais → Chave de API**.
2. Abre a chave criada → nome `scoutknock-places-servidor`.
3. **Restrições de API → Restringir chave → Places API (New)** (e mais nenhuma).
4. **Restrições de aplicação:** a Vercel não tem IP fixo nos planos normais, por isso não dá para limitar por IP de forma fiável. Deixa "Nenhuma" e compensa com: restrição de API, quotas (passo 6) e chave só no servidor (nunca `NEXT_PUBLIC_`, nunca no browser).
5. Guarda. Copia a chave **diretamente** para o `.env.local` (`GOOGLE_PLACES_API_KEY=...`) e, mais tarde, para a Vercel. Não a coles no chat.

## 5. Orçamento com alertas
1. **Faturação → Orçamentos e alertas → Criar orçamento**.
2. Nome `scoutknock-mensal`; âmbito: o projeto `scoutknock`.
3. Valor: sugestão **20 €/mês** na fase de testes (ajusta quando houver clientes).
4. Alertas em **50%, 90% e 100%** do valor real; junta também um alerta de **100% do valor previsto**.
5. Confirma que os avisos vão para o teu email.

## 6. Quotas (o limite que de facto trava)
1. **APIs e serviços → Places API (New) → Quotas e limites do sistema**.
2. Procura as quotas de **Text Search** (pedidos por dia e por minuto) e **Place Details**.
3. Edita e define um teto por dia. Sugestão para a fase de testes: **100 pedidos/dia** de pesquisa e o mesmo para detalhes. Sobe depois, com dados reais.
4. Se uma quota não permitir edição, regista o nome e diz-me: o travão do passo 7 cobre-a.

## 7. Travão de custo no código (pedir ao Claude Code)
Como o orçamento não corta nada, o código tem de o fazer:
- Antes de cada chamada ao Google, somar o custo do dia (e do mês) na tabela `api_costs`. Se passar o teto configurado (`GOOGLE_DAILY_BUDGET_EUR`, `GOOGLE_MONTHLY_BUDGET_EUR` no `.env`), **não chamar** e mostrar ao utilizador uma mensagem honesta ("A busca está temporariamente indisponível").
- Registar cada chamada com o custo estimado (`provider = google_places`, `kind`, `units`, `cost_eur`).
- Respeitar a regra do projeto: custo por utilizador ≤ 30% do preço do pack. Exemplo: Inicial 19 € → máximo 5,70 €/mês de API por utilizador. Com 100 buscas, isso dá cerca de 0,057 € por busca, incluindo todas as chamadas que ela fizer (paginação e detalhes contam).
- Uma busca pode gerar várias chamadas. Medir o custo real de 10 buscas de teste e só depois fechar os limites dos packs.
- Cache dentro dos termos do Google (ver termos do Places sobre o que se pode guardar e por quanto tempo) para não pagar duas vezes pelos mesmos dados.
- Alerta ao Daniel (Telegram/email) quando o dia chegar a 80% do teto.

## 8. Teste antes de abrir ao público
- [ ] Chave no `.env.local`, ficheiro fora do Git
- [ ] Chave restrita só a Places API (New)
- [ ] Orçamento criado com os 4 alertas
- [ ] Quotas diárias definidas
- [ ] 10 buscas de teste feitas e custo real anotado
- [ ] Travão de custo testado (baixar o teto a 0 e confirmar que bloqueia)
- [ ] Verificar no Cloud Console, no dia seguinte, o gasto real

## Se algo correr mal
- Gasto estranho: **APIs e serviços → Credenciais → desativar a chave** (corta tudo de imediato), depois investiga.
- Suspeita de fuga da chave: apagar, criar outra com as mesmas restrições, atualizar `.env.local` e Vercel.
