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

Nenhuma. A próxima é a primeira de "Próximas", quando o Daniel disser.

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
