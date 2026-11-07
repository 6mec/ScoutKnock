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

### T16. Rever e melhorar a estrutura e a usabilidade da app web
Só plano curto (máximo 1 página) e esperar a aprovação do Daniel antes de mexer no código. Ação, não relatório longo.
Problema: partes da app fazem o mesmo que outras e há sítios pouco práticos ou pouco profissionais. Percorrer a app inteira como utilizador (Radar, Contactos, Projetos, Pedidos, Portfólio, Início, Mais, proposta, demos).
- Funcionalidades duplicadas ou sobrepostas: qual fica e o que se junta ou esconde (nunca apagar dados nem tabelas; esconder da interface chega).
- Usabilidade: cliques a mais, estados vazios, nomes pouco claros, ações escondidas, formulários confusos, problemas no telemóvel, textos soltos ou em inglês.
- Menu simples à volta do trabalho diário: encontrar empresas, contactar, acompanhar, projetos, portfólio.
- Código duplicado só se bloquear as melhorias.
Regras: funcionalidades em pausa (Stripe, packs, registos, Google Places) escondidas, não apagadas; sem conteúdo nem números inventados; sem custos novos; textos no ficheiro de traduções; o que altere dados ou ligue ao exterior volta ao Daniel.
Formato do plano: tabela "problema, onde, solução proposta, esforço (pequeno, médio, grande)", ordenada pelo que mais melhora a experiência, em fases pequenas (cada uma com testes, lint e build), com a fase que começa primeiro.

## Próximas (por ordem)

### T11. Site-base reutilizável para clientes
Um projeto-modelo fora deste repositório (por exemplo `../ScoutKnock-clientes/_base`), de onde se copia o site de cada cliente: páginas, identidade por nicho, secção de marcações por WhatsApp, SEO básico e instruções de publicação com domínio e alojamento em nome do cliente. O `/pedidos` passa a usá-lo para os pedidos de site. Plano curto antes, com a tecnologia e o que custa alojar.

### T7. Verificações técnicas de conformidade (sem jurídico, versão curta)
Lista de licenças das dependências e fontes em `docs/licencas.md` (com o OpenStreetMap/ODbL); confirmar que as páginas públicas não carregam scripts ou fontes de terceiros; listar cookies e armazenamento local com a finalidade.

## Em pausa (envolvem decisões legais, fiscais ou dinheiro, ou só servem para vender a outros)

- T8. Landing com personalidade e correções pequenas
  Por esta ordem, parando no fim de cada bloco com capturas antes/depois: (1) simulação interativa, que substitui a secção dos interruptores e mantém os pontos de cada motivo; (2) cartões flutuantes fixos no herói, só no computador e sem temporizador nem animação de entrada/saída, e "Como funciona" com ecrã maior e menos scroll; (3) planos na app e na landing, com limites, "Preço em breve", "abertura de contacto" explicada e só os 5 €/mês do site oficial; (4) propostas 1 a 5 da T5.
  Lighthouse mínimo de 95 nos ecrãs alterados (landing, entrada, painel, Contactos e outros mexidos); Demos e Conta reportam-se à parte. Só dados de exemplo; não numerar secções além de "Como funciona"; sem números inventados, urgência nem falsas notificações.
  

- Apagamento automático de eventos e alerta aos 80% do teto de custo (depende do prazo de conservação e do jurista).
- Política de reembolso no ecrã de Planos (depende da decisão do Daniel e do jurista).
- Registo da data e versão dos termos aceites (depende dos textos finais).
- Ligar chaves reais (Google, Anthropic, Stripe), domínio e SMTP.
- Verificação dos sites ligada em produção.
- Brasil e inglês (só quando o Daniel decidir; o uso é pessoal e mundial, mas a interface fica em português por agora).

## Feitas

Histórico completo no Git (git log -p -- docs/tarefas.md). Estado a 07/11/2026: ScoutKnock online na Netlify em scoutkncok.com, Radar a funcionar online, Início com dashboard, pagamentos recebidos, projetos por cliente, pedidos (/pedidos) e portfólio público.

## Decisões já tomadas

- Lançamento só em Portugal. Brasil e outros países depois.
- Os dados do Google não se guardam: só o `place_id` e o que o freelancer escreve.
- Limites dos packs provisórios, para cumprir 30% do preço no pior caso. Rever com custos reais.
- O consumo renova no período da subscrição do Stripe, não a 1 de cada mês.
- Depois do teste, o limite desce ao mais baixo. Teste de 7 dias sem cartão.
- A app é só do Daniel (04/11/2026): serve para vender sites e apps definitivos a empresas de qualquer país, cada cliente com projeto próprio; o construtor de demos deixa de receber funcionalidades. Landing de venda, planos e Stripe ficam adormecidos. A cobrança aos clientes é por fora da app.
- Sem pagar serviços nem tratar do jurídico/fiscal até o Daniel dizer que o site lhe agrada a 100%.
