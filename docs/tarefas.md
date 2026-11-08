# Tarefas do ScoutKnock

Fonte de verdade da fila de trabalho. Quem escreve as tarefas: o Daniel e o assistente de planeamento (o Claude do chat). Quem as executa: o Claude Code.

## Como trabalhar (Claude Code)

1. Pega na **primeira tarefa "Em curso" ou, se não houver, na primeira "Próximas"**, por ordem.
2. Propõe um plano curto e **espera a aprovação do Daniel** antes de escrever código.
3. Faz só essa tarefa. Corre testes, lint e build. Mostra capturas se mexeu em ecrãs.
4. No fim, **atualiza este ficheiro**: passa a tarefa para "Feitas" com a data e duas linhas do que mudou, e atualiza `docs/pendente.md`.
5. Não começas a tarefa seguinte sem o Daniel dizer.
6. Regras de todas as tarefas: nada que custe dinheiro nem chaves reais; nada jurídico ou fiscal (os textos legais ficam provisórios); nada de Brasil enquanto o interruptor estiver em PT.

## Em curso

### T17. Design, organização e ligações do ciclo
Ciclo: Radar → Contactos → Sessão de contactos → Proposta → Projeto → Entrega → Portfólio → Manutenção; o Dashboard lê os números de todas as partes; nada se escreve duas vezes.
Regras: não apagar dados, tabelas, rotas nem funcionalidades; migrações só incrementais (aplicadas pelo Daniel); não mexer na autenticação nem no Ctrl K; sem dados falsos (estado vazio claro); tudo em local, sem push, até o Daniel dizer.
Plano aprovado a 08/11/2026. Ordem: 1a estilo "minimal luxury" (claro por omissão, escuro opcional, Inter); 1b menu por grupos (Pedidos ficam como separador de Projetos; Definições = Conta); Fase 2 ligações (propostas registadas, Ganho cria o projeto, fases, checklist, pagamentos previstos, entrega → rascunho no Portfólio, cobrança da manutenção, `{link_demo}` com demo "exemplo do nicho"); 1c Dashboard; Fase 3 prospeção (Radar em 3 estados, Sessão de contactos, ficha ao lado); Fase 4 Equipa (estrutura, sem abrir o acesso).
- 1a e 1b feitas (08/11/2026): tokens claros e escuros novos (fundo #F7F7F4, superfícies brancas, verde sálvia, dourado só em detalhes), Inter, claro por omissão; menu por grupos numa só fonte (`nav-items.ts`) com caminho no topo; página Equipa (só o membro atual); "Conta" passa a "Definições" (mesmo endereço).
- Fase 2 feita (08/11/2026; migração `20261127000000_cycle_links.sql` aplicada): propostas na ficha (rascunho, enviada, aceite, recusada), "Ganho" ou proposta aceite cria o projeto (fases, checklist do modelo, sinal e final previstos, origem), ciclo no diálogo do projeto (fases, próximo passo, checklist, terminar/reabrir), pagamentos previstos e recebidos, cobranças nas próximas tarefas, "pedir opinião" cria o rascunho no Portfólio, `{empresa}`/`{link_demo}`/`{link_portfolio}` com aviso e demo "exemplo do nicho"; o Radar guarda o nicho e a zona das empresas do OpenStreetMap.
- 1c feita: Dashboard com a fila (e "Começar sessão de contactos") e a meta em cima, 7 números (vendas, a receber, em curso, manutenção, taxa de resposta, propostas abertas, entregues), recebido por mês, funil (saiu dos Contactos) e atividade recente.
- Fase 3 feita: Radar em 3 estados (repouso com pesquisa em frase, pesquisas guardadas e zonas exploradas; animação só a procurar; resumo com total/novas/já guardadas, mapa pequeno e "Guardar as novas"); página Sessão de contactos (fila uma a uma, mensagem preenchida, Contactada/Saltar/Não contactar, retorno 1/3/7 dias, meta, próximas e registo); Contactos com "Parada há X dias", ficha ao lado, atalhos de retorno e "Fechar negócio e criar projeto".
- Fase 4 feita: página Equipa com o membro atual, convites pendentes (não enviados) e funções; campo "responsável" em contactos e projetos, sem mudar o acesso. As pesquisas guardadas e os convites precisam da migração `20261128000000_prospecting_team.sql` (por aplicar).

## Próximas (por ordem)



## Em pausa (envolvem decisões legais, fiscais ou dinheiro, ou só servem para vender a outros)



## Feitas

Histórico completo no Git (git log -p -- docs/tarefas.md). Estado a 07/11/2026: ScoutKnock online na Netlify em scoutkncok.com, Radar a funcionar online, Início com dashboard, pagamentos recebidos, projetos por cliente, pedidos (/pedidos) e portfólio público.

- T16 (08/11/2026): estrutura e usabilidade revistas em 5 fases. Menu pela ordem do trabalho com os pausados escondidos; Dashboard abre com o dia; Contactos começam na lista; ficha com um só grupo "Mensagem"; cartão do projeto clicável; Pedidos como separador dos Projetos e "Criar projeto" que pode pedir também ao /pedidos.
  Editor do Portfólio com índice das secções e barra de guardar fixa ("Alterações por guardar"); títulos iguais ao menu; tema só no menu da conta e no "Mais"; a proposta preenche o nome com o da Conta ou do Portfólio.

## Decisões já tomadas

- Lançamento só em Portugal. Brasil e outros países depois.
- Os dados do Google não se guardam: só o `place_id` e o que o freelancer escreve.
- Limites dos packs provisórios, para cumprir 30% do preço no pior caso. Rever com custos reais.
- O consumo renova no período da subscrição do Stripe, não a 1 de cada mês.
- Depois do teste, o limite desce ao mais baixo. Teste de 7 dias sem cartão.
- A app é só do Daniel (04/11/2026): serve para vender sites e apps definitivos a empresas de qualquer país, cada cliente com projeto próprio; o construtor de demos deixa de receber funcionalidades. Landing de venda, planos e Stripe ficam adormecidos. A cobrança aos clientes é por fora da app.
- Sem pagar serviços nem tratar do jurídico/fiscal até o Daniel dizer que o site lhe agrada a 100%.
